packer {
  required_plugins {
    amazon = {
      source  = "github.com/hashicorp/amazon"
      version = "> 1.3"
    }
  }
}

source "amazon-ebs" "aws_image" {
  region        = var.aws_region
  instance_type = var.aws_instance_type
  ami_name      = "aws-ami-{{timestamp}}"
  source_ami    = var.source_ami
  subnet_id     = var.subnet_id
  ssh_username = var.ssh_username

  tags = {
    Name        = "aws-mi"
    Environment = "DEV"
  }


  # EBS volume settings
  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1" #primary root volume deafult for ubuntu
    volume_size           = 25          # Increase disk size for PostgreSQL
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.aws_image"]

  #  Updating OS
  provisioner "shell" {
    inline = [
      "sudo apt update -y",
      "sudo apt upgrade -y"
    ]
  }

 # Install System Dependencies 
provisioner "shell" {
  inline = [
    "export DEBIAN_FRONTEND=noninteractive", 
    "sudo apt update -y",
    "sudo apt install -y --no-install-recommends apt-utils",  # Ensures faster package installs
    "sudo apt install -y --no-install-recommends postgresql postgresql-contrib unzip",
    "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
    "sudo apt install -y --no-install-recommends nodejs",
  ]
}

  
  # Execute the user script
  provisioner "shell" {
    script = "./scripts/user"
  }
  

  # webapp application
  provisioner "file" {
    source      = "./webapp.zip"
    destination = "/tmp/webapp.zip"
  }
  
  
  provisioner "shell" {
    script = "./scripts/file_extract"
  }

  provisioner "file" {
  source      = "webapp.service" 
  destination = "/tmp/webapp.service"
  }


  provisioner "shell" {
    script = "./scripts/script"
  }

  

    provisioner "shell" {
    script = "./scripts/db_bash"
    environment_vars = [
      "DB_PASSWORD=${var.password}",
      "DB_NAME=${var.database_name}"
    ]
  }

  

}
