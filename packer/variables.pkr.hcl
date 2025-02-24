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
  default = "ami-05295e614f3f04be4"
}

variable "subnet_id" {  
  type    = string
  description = "The AWS subnet where the instance will be launched"
}

variable "service_account_email" {  
  type    = string
  description = "The service account email used for authentication (if applicable)"
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "password" {
  type = string
}

variable "database_name" {
  type    = string
  default = "health-check_db"
}