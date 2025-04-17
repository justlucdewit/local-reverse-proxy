# Local reverse proxy
A simple NodeJS reverse proxy meant to reroute requests locally to certain ports based on entries and comments written in your /etc/hosts file.

## Usage
In your /etc/hosts file you should notate your entries like the following:
```hosts
127.0.0.1 a.test #!8080
127.0.0.1 b.test #!8081
127.0.0.1 c.test #!8082
```

Now when you run the proxy using `node index.js` You can go to `http://a.test` in your browser which will then be rerouted to localhost:8080 automatically

## Future plans
 - Detect if /etc/hosts has been changed so you dont need to restart the RP
 - Add a dashboard where you can view what entries are available and edit them
 - Inject debugging tools for your project
 - Add support for https protocol