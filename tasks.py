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
def ansible_playbook(c, name, extra="", verbosity=1):
    with c.cd("deploy/"):
        c.run(f"ansible-playbook {name} {extra} -{'v'*verbosity}")


ns = invoke.Collection()
ns.add_collection(kubesae.image)
ns.add_collection(kubesae.aws)
ns.add_collection(kubesae.deploy)
ns.add_collection(kubesae.pod)
ns.add_task(staging)
ns.add_task(production)
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
