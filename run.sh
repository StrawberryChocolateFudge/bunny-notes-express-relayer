#!/bin/bash

echo "Enter the secret key"
read -s secret_key

NODE_ENV=production SECRETKEY=${secret_key} pm2 start bin/www