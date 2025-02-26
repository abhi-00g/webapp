variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_instance_type" {
  type    = string
  default = "t2.micro"
}

variable "source_ami" {
  type    = string
  default = "ami-02f9afd340e6c0065"
}

variable "subnet_id" {
  type    = string
  default = "subnet-008492f12b655d5f0"
}

variable "service_account_email" {
  type    = string
  default = "gcp-service"
}


variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "db_password" {
  type    = string
  default = "password"
}

variable "db_name" {
  type    = string
  default = "health_check_db"
}

variable "gcp_project_id" {
  type    = string
  default = "dev_project"
}

variable "gcp_region" {
  type    = string
  default = "us-east-4"
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "source_gcp" {
  type    = string
  default = "ubuntu-2204-lts"
}

variable "gcp_zone" {
  type    = string
  default = "c"
}

variable "db_host" {
  type    = string
  default = "host"
}

variable "db_port" {
  type    = number
  default = 54331
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "profile" {
  type    = string
  default = "dev"
}

variable "webapp_path" {
  type    = string
  default = "./webapp.zip"
}