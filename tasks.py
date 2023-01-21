import invoke
import kubesae
import yaml
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
def ansible_playbook(c, name, extra="", verbosity=1):
    with c.cd("deploy/"):
        c.run(f"ansible-playbook {name} {extra} -{'v'*verbosity}")


ns = invoke.Collection()
ns.add_collection(kubesae.image)
ns.add_collection(kubesae.aws)
ns.add_collection(kubesae.deploy)
ns.add_collection(kubesae.pod)
ns.add_collection(kubesae.info)
ns.add_collection(kubesae.utils)

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
        "hosting_services_backup_folder": "trafficstops",
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
