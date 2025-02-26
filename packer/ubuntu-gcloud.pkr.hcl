# packer {
#   required_plugins {
#     googlecompute = {
#       version = "> 1.1.2"
#       source  = "github.com/hashicorp/googlecompute"
#     }
#   }
# }
# source "googlecompute" "google-image" {
#   project_id          = var.gcp_project_id
#   source_image_family = var.source_gcp
#   image_name          = "google-mi-{{timestamp}}"
#   machine_type        = var.machine_type
#   region              = var.gcp_region
#   zone                = "${var.gcp_region}-a"
#   ssh_username        = var.ssh_username
# }

# build {
#   sources = [
#     "source.googlecompute.google-image"
#   ]
#   #  Updating OS
#   provisioner "shell" {
#     inline = [
#       "sudo apt update -y",
#       "sudo apt upgrade -y"
#     ]
#   }

#   # Install System Dependencies 
#   provisioner "shell" {
#     inline = [
#       "export DEBIAN_FRONTEND=noninteractive",
#       "sudo apt update -y",
#       "sudo apt upgrade -y",
#       "sudo apt install -y --no-install-recommends apt-utils",
#       "sudo apt install -y --no-install-recommends postgresql postgresql-contrib unzip",
#       "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -",
#       "sudo apt install -y --no-install-recommends nodejs",
#     ]
#   }




#   # Execute the user script
#   provisioner "shell" {
#     script = "./scripts/user"
#   }


#   # webapp application
#   provisioner "file" {
#     source      = "./webapp.zip"
#     destination = "/tmp/webapp.zip"
#   }


#   provisioner "shell" {
#     script = "./scripts/file_extract"
#   }

#   provisioner "file" {
#     source      = "webapp.service"
#     destination = "/tmp/webapp.service"
#   }


#   provisioner "shell" {
#     script = "./scripts/script"
#   }



#   provisioner "shell" {
#     script = "./scripts/db_bash"
#     environment_vars = [
#       "DB_PASSWORD=${var.password}",
#       "DB_NAME=${var.database_name}"
#     ]
#   }
# }

