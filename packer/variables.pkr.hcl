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
}

#variable "service_account_email" {  
 # type    = string
#}

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

variable "gcp_project_id" {
  type = string
}

variable "gcp_region" {
  type    = string
  default = "us-east4"
}

variable "machine_type" {
  type    = string
  default = "e2-small"
}

variable "source_gcp" {
  type = string
}
