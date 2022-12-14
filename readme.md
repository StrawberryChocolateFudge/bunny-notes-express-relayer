# Bunny notes express relayer

This server relays zero-knowledge proofs and submites them to BTTC network using ethers.js.

## Server setup

`sudo apt update`

`sudo apt upgrade`

`adduser bunny`

`usermod -aG sudo bunny`

`sudo apt install nginx`

# Snap is needed due to certbot install
`sudo apt install snapd`

`sudo snap install --classic certbot`

`sudo ln -s /snap/bin/certbot /usr/bin/certbot`

`sudo certbot --nginx`

# nodejs install

`curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -`

`sudo apt-get install -y nodejs`

`npm install -g pm2`

`pm2 startup systemd`

Clone the express server from github

Install the dependencies and run the server with pm2 from the bunny user.

`npm install`

# Run the server

`NODE_ENV=<> SECRETKEY=<> pm2 start bin/www`
