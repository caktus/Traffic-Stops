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
        role_arn = arn:aws:iam::000000000000:role/CaktusAccessRole
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
