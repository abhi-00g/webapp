variable "aws_region" {
  type    = string
  default = ""
}

variable "aws_instance_type" {
  type    = string
  default = ""
}

variable "source_ami" {
  type    = string
  default = ""
}

variable "subnet_id" {
  type    = string
  default = ""
}

#variable "service_account_email" {  
# type    = string
#}

variable "ssh_username" {
  type    = string
  default = ""
}

variable "password" {
  type    = string
  default = ""
}

variable "database_name" {
  type    = string
  default = ""
}

variable "gcp_project_id" {
  type    = string
  default = ""
}

variable "gcp_region" {
  type    = string
  default = ""
}

variable "machine_type" {
  type    = string
  default = ""
}

variable "source_gcp" {
  type    = string
  default = ""
}
