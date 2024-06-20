# Hosting Services

The services configured for this project are:
* PostgreSQL database backups to S3 (within Caktus AWS account)
    * Currently, this is only `traffic_stops`, which contains users, census data, etc.
    * `traffic_stops_nc` is not backed up since the entire dataset is re-imported daily.
* Papertrail logging (to Caktus account)
* New Relic Infrastructure monitoring (Account: `admin+newrelic@caktusgroup.com`)

## Monitoring

Amazon CloudWatch Metrics receives data via the [aws-cloudwatch-metrics](https://github.com/aws/eks-charts/tree/master/stable/aws-cloudwatch-metrics)
Helm chart. To view metrics, login to the AWS account (via the Caktus AssumeRole, above), then:

- Go to CloudWatch
- Click "All Metrics"
- Click "ContainerInsights"
- Drill down as needed

CloudWatch Alarms can be created via Ansible, e.g., to provide an alert on high CPU utilization. See `deploy/deploy-cluster.yml` and add to the "Create alarms" task, as needed.

## Production database disaster recovery

In the event a restore from a historical backup is needed, access to the [Caktus
AssumeRole is
required](https://github.com/caktus/caktus-hosting-services/blob/main/docs/aws-assumerole.md#aws-accounts).
Once you have that access, you can use invoke tools to pull historical backups.

To download the latest `daily` backup:

```sh
inv utils.get-db-backup
```


## Production backup configuration

[caktus.k8s-hosting-services](https://github.com/caktus/ansible-role-k8s-hosting-services)
manages database backups.

Run this command to set up database backups and monitoring services:

```sh
inv deploy.playbook -n deploy-hosting-services.yml
```
