import invoke
import kubesae
from colorama import init


init(autoreset=True)


@invoke.task
def staging(c):
    c.config.env = "staging"
    c.config.namespace = "trafficstops-staging"


@invoke.task()
def up(c, build=False):
    """Test production image locally using docker-compose
    """
    if build:
        kubesae.image["tag"](c)
        kubesae.image["build"](c)
    c.run("docker-compose up --remove-orphans")


@invoke.task
def ansible_playbook(c, name, extra="", verbosity=1):
    with c.cd("deploy/"):
        c.run(f"ansible-playbook {name} {extra} -{'v'*verbosity}")


ns = invoke.Collection()
ns.add_collection(kubesae.image)
ns.add_collection(kubesae.aws)
ns.add_collection(kubesae.deploy)
ns.add_collection(kubesae.pod)
ns.add_task(staging)
ns.add_task(ansible_playbook, "playbook")
ns.add_task(up)
ns.configure(
    {
        "app": "trafficstops_app",
        "aws": {
            "region": "us-east-2",
        },
        "cluster": "trafficstops-stack-cluster",
        "container_name": "app",
        "repository": "",
        "run": {
            "echo": True,
            "pty": True,
            "env": {
                "COMPOSE_FILE": "docker-compose.yml:docker-compose.deploy.yml",
            },
        },
    }
)
