aws_region        = "us-east-1"       # AWS region
aws_instance_type = "t2.micro"        # Instance type (smallest available)
subnet_id         = "subnet-008492f12b655d5f0"  # AWS Subnet where instance will be launched
source_ami       = "ami-02f9afd340e6c0065"  # Custom AMI ID built using Packer
password  = "DB_PASSWORD"
database_name = "health_check_db"

# Optional:
# service_account_email = "your-service-account@gcp.com"  # AWS IAM role email (if applicable)