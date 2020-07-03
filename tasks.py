import invoke
import kubesae
from colorama import init


init(autoreset=True)


@invoke.task
def staging(c):
    c.config.env = "staging"
    c.config.namespace = "odp-staging"


@invoke.task()
def up(c, build=False):
    """Test production image locally using docker-compose
    """
    if build:
        kubesae.image["tag"](c)
        kubesae.image["build"](c)
    c.run("docker-compose up --remove-orphans")


ns = invoke.Collection()
ns.add_collection(kubesae.image)
ns.add_collection(kubesae.aws)
ns.add_collection(kubesae.deploy)
ns.add_collection(kubesae.pod)
ns.add_task(staging)
ns.add_task(up)
ns.configure(
    {
        "app": "opendatapolicing_app",
        "aws": {
            "region": "us-east-1",
        },
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
