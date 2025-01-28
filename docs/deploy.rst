Deployment
==========


Caktus AWS Access
-----------------

1. Configure your Caktus IAM account locally using a `named profile`_. The
   following documentation assumes the profile is named ``caktus``.

2. Manually create a new ``trafficstops`` profile in ``~/.aws/credentials``
   with:

    .. code-block::

        [trafficstops]
        role_arn = arn:aws:iam::000000000000:role/CaktusAccountAccessRole-Admins
        source_profile = caktus

    See LastPass entry *Traffic Stops AWS Profile role_arn* for the AWS account
    ID.

3. Enable this profile in your shell with:

    .. code-block::

        export AWS_PROFILE=trafficstops

4. Test access with:

    .. code-block::

        aws s3 ls


.. _named profile: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html


Create EKS cluster CloudFormation stack
---------------------------------------

1. Edit ``Global`` and ``caktus.aws-web-stacks`` variables in
   ``deploy/group_vars/all.yml`` for needs of project.

2. Provision cluster::

    inv playbook -n deploy-cf-stack.yml

3. Configure kubectl to connect to the Amazon EKS cluster::

    inv aws.configure-eks-kubeconfig


Create PostgreSQL database
---------------------------------------

1. Launch a temporary debian pod within the cluster::

    inv pod.debian

2. Install ``postgresql-client`` and connect to the RDS PostgreSQL cluster as
   the admin user::

    apt update && apt install postgresql-client -y
    export DATABASE_URL=...
    psql $DATABASE_URL

3. Create environment-specific databases, e.g.::

```sql
    CREATE ROLE trafficstops_staging WITH LOGIN NOSUPERUSER INHERIT CREATEDB NOCREATEROLE NOREPLICATION PASSWORD '<password>';
    CREATE DATABASE trafficstops_staging;
    GRANT CONNECT ON DATABASE trafficstops_staging TO trafficstops_staging;
    GRANT ALL PRIVILEGES ON DATABASE trafficstops_staging TO trafficstops_staging;
    CREATE DATABASE trafficstops_staging_nc;
    GRANT CONNECT ON DATABASE trafficstops_staging_nc TO trafficstops_staging;
    GRANT ALL PRIVILEGES ON DATABASE trafficstops_staging_nc TO trafficstops_staging;
```


Configure cluster for deploying web applications
------------------------------------------------

1. Edit ``caktus.k8s-web-cluster`` variables in ``deploy/group_vars/all.yml``
   for needs of project.

2. Generate temporary AWS access credentials and export them into shell
   environment::

    python ./deploy/boto-temporary-creds.py

3. Configure cluster::

    inv playbook -n deploy-cluster.yml


Deploy application
------------------------------------------------

1. Edit variables in ``deploy/group_vars/k8s.yml`` and
   ``deploy/group_vars/staging.yml`` for needs of project.

2. Log into Docker registry::

    inv aws.docker-login

3. Build and push image::

    inv image.push

4. Deploy::

    inv staging deploy --tag=...


CloudFront distributions
------------------------------------------------

The application is behind a CloudFront distribution.

To deploy the distribution, run::

    ansible-playbook deploy-cf-stack.yml -t cdn -vvvv
