import yaml
import invoke
import kubesae
from colorama import init


init(autoreset=True)


@invoke.task
def staging(c):
    c.config.env = "staging"
    c.config.namespace = "trafficstops-staging"


@invoke.task
def production(c):
    c.config.env = "production"
    c.config.namespace = "trafficstops-production"


@invoke.task
def pod_stats(c):
    """Report total pods vs pod capacity."""
    nodes = yaml.safe_load(c.run("kubectl get nodes -o yaml", hide="out").stdout)
    pod_capacity = sum([int(item["status"]["capacity"]["pods"]) for item in nodes["items"]])
    pod_total = c.run(
        "kubectl get pods --all-namespaces | grep Running | wc -l", hide="out"
    ).stdout.strip()
    print(f"Running pods: {pod_total}")
    print(f"Maximum pods: {pod_capacity}")
    print(f"Total nodes: {len(nodes['items'])}")

@invoke.task
def build_ci_images(c):
    """Build CircleCI test image using docker-compose"""
    c.run("docker-compose -f docker-compose.yml -f docker-compose-deploy.yml build app")


@invoke.task(help={"command": "Passes a command to the container to run (ex: 'ls -la')"})
def run_in_ci_image(c, command):
    """Runs command in the CircleCI test container.

    Args:
        command (str): A bash style command line command of variable length and composition.
    Usage:
        inv ci-run --command='pytest'
    """
    c.run(
        f"docker-compose -f docker-compose.yml -f docker-compose-deploy.yml run --rm app sh -lc '{ command }'"
    )

@invoke.task
def build_deployable(c):
    """Builds a deployable image using the Dockerfile"""
    kubesae.image["tag"](c)
    c.run(f"docker build -t {c.config.app}:{c.config.tag} .")

@invoke.task(pre=[build_deployable])
def build_deploy(c, push=True, deploy=True):
    """Pushes the built images"""
    if push:
        kubesae.image["push"](c)
    if deploy:
        kubesae.deploy["deploy"](c)

@invoke.task
def ansible_playbook(c, name, extra="", verbosity=1):
    with c.cd("deploy/"):
        c.run(f"ansible-playbook {name} {extra} -{'v'*verbosity}")

project = invoke.Collection("project")
project.add_task(build_ci_images, name="ci-build")
project.add_task(run_in_ci_image, name="ci-run")
project.add_task(build_deploy)

ns = invoke.Collection()
ns.add_collection(kubesae.image)
ns.add_collection(kubesae.aws)
ns.add_collection(kubesae.deploy)
ns.add_collection(kubesae.pod)
ns.add_collection(project)
ns.add_task(staging)
ns.add_task(production)
ns.add_task(pod_stats)
ns.add_task(ansible_playbook, "playbook")

ns.configure(
    {
        "app": "trafficstops_app",
        "aws": {
            "region": "us-east-2",
        },
        "cluster": "trafficstops-stack-cluster",
        "container_name": "app",
        "repository": "606178775542.dkr.ecr.us-east-2.amazonaws.com/traff-appli-gvyudgfsjhrz",
        "run": {
            "echo": True,
            "pty": True,
            "env": {
                "COMPOSE_FILE": "docker-compose.yml:docker-compose.deploy.yml",
            },
        },
    }
)
