packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "> 1.3"
    }
    googlecompute = {
      version = "> 1.1.2"
      source  = "github.com/hashicorp/googlecompute"
    }
  }
}

source "amazon-ebs" "aws_image" {
  region        = var.aws_region
  profile       = var.profile
  instance_type = var.aws_instance_type
  ami_name      = "aws-ami-{{timestamp}}"
  source_ami    = var.source_ami
  subnet_id     = var.subnet_id
  ssh_username  = var.ssh_username
  tags = {
    Name = "aws-mi"
  }
  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
  }
}

source "googlecompute" "gcp_image" {
  project_id              = var.gcp_project_id
  source_image_family     = "ubuntu-2204-lts"
  source_image_project_id = ["ubuntu-os-cloud"]
  image_name              = "google-mi-{{timestamp}}"
  machine_type            = var.machine_type
  region                  = var.gcp_region
  zone                    = "${var.gcp_region}-${var.gcp_zone}"
  ssh_username            = var.ssh_username
  service_account_email   = var.service_account_email
}

build {
  sources = [
    "source.amazon-ebs.aws_image",
    //"source.googlecompute.gcp_image"
  ]

  provisioner "shell" {
    inline = [
      "sudo apt update -y",
      "sudo apt upgrade -y"
    ]
  }

  provisioner "shell" {
    inline = [
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt update -y",
      "sudo apt install -y --no-install-recommends apt-utils",
      "sudo apt install -y --no-install-recommends postgresql postgresql-contrib unzip",
      "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
      "sudo apt install -y --no-install-recommends nodejs",
    ]
  }

  provisioner "shell" {
    script = "./scripts/user"
  }

  provisioner "file" {
    source      = var.webapp_path
    destination = "/tmp/webapp.zip"
  }

  provisioner "shell" {
    script = "./scripts/file_extract"
  }

  provisioner "shell" {
    script = "./scripts/db_bash"
    environment_vars = [
      "DB_PASSWORD=${var.db_password}",
      "DB_NAME=${var.db_name}",
      "DB_HOST=${var.db_host}",
      "DB_PORT=${var.db_port}",
      "DB_USER=${var.db_username}",
    ]
  }

  provisioner "file" {
    source      = "webapp.service"
    destination = "/tmp/webapp.service"
  }

  provisioner "shell" {
    script = "./scripts/script"
  }
}
