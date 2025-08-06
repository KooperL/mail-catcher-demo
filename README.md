> [!IMPORTANT]  
> - Make sure port 25 (SMTP) is open and accessible. **This is not always the case on cloud compute**
> - For production, secure your server and upgrade to HTTPS for the web interface.


# Mail Catcher

Mail-catcher is a disposable mail service designed for testing and temporary email needs. In can be stood up in just a few commands on a dedicated server or VPS.
By default, it will render unsanitized HTML.

## Purpose

- Receive temporary emails for testing or registration.
- Realtime email updates
- Protect your primary inbox from spam.
- Use for QA, development, or demo environments.
- Forward emails to a primary inbox.

## Setup

### Required software

- git
- docker

### Running

1. **Clone the Repository**
    ```sh
    git clone https://github.com/kooperl/mail-catcher.git
    cd mail-catcher
    ```

2. **Launch the docker container in detached mode**
    ```sh
    docker compose up -d
    ```

5. **Access the Web Interfaces**
    - The default port is `80` for this application (defined in `docker-compose`). It can be changed if your server is already busy on this port
    - The pocketbase admin panel will not be accessible at `http://127.0.01:8090/_/`. Please use port `80` instead (this is due to the port mounting in the `docker-compose.yml`)
    - Mount a `pb_data` to retain email data, otherwise it will be wiped on reboots

### DNS Configuration

To receive emails for your domain, and make the web server accessible, add a pair of `A` and `MX` records, as such:

| Type | Name                | Value                | Priority |              |
|------|---------------------|----------------------|----------|--------------|
| MX   | @                   | yourdomain.com       | 10       |              |
| A    | yourdomain.com      | 123.45.67.89         |          |              |
| MX   | sub                 | sub.yourdomain.com   | 10       |OPTIONAL      |
| A    | sub.yourdomain.com  | 123.45.67.89         |          |EXTRA DOMAIN  |

This will make your server reachable on the domain given in the `A` record. 
The `MX` record will also be the domain used for your email address. In the example above, we define two reachable domains.


### SMTP

Mail Catcher uses the default PocketBase mail implementation, which is a wrapper over the system's `sendmail` utility. Note that most cloud compute providers disable or restrict `sendmail` by default. To ensure reliable email delivery, configure PocketBase to use a hosted SMTP provider in the admin panel.
