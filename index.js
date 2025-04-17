const fs = require('fs');
const http = require('http');
const httpProxy = require('http-proxy');

function getTestDomainsFromHosts() {
    const hostsFilePath = '/etc/hosts';
    const hostsContent = fs.readFileSync(hostsFilePath, 'utf-8');

    // Regular expression to match lines that:
    // - start with 127.0.0.1
    // - end with a domain ending in .test
    // - and contain a comment starting with #! and followed by the port number
    const regex = /^127\.0\.0\.1\s+([a-zA-Z0-9.-]+\.test)\s+#!(\d+)$/gm;
    
    const domains = [];
    let match;

    // Find all occurrences of .test domains with port in the /etc/hosts file
    while ((match = regex.exec(hostsContent)) !== null) {
        // match[1] is the domain and match[2] is the port
        domains.push({ domain: match[1], port: match[2] });
    }

    return domains;
}

const proxyTable = {};
const hostsFileItems = getTestDomainsFromHosts();
hostsFileItems.forEach(item => {
    console.log(`Registered domain to proxy: ${item.domain} => http://127.0.0.1:${item.port}`);
    proxyTable[item.domain] = `http://127.0.0.1:${item.port}`
});

// Create a proxy server
const proxy = httpProxy.createProxyServer();

const server = http.createServer(async (req, res) => {
    const u = req.headers.host;
    const domain = u.split(".").slice(Math.max(u.split(".").length - 2, 0)).join(".")
    const target = proxyTable[domain];

    if (target) {
        console.log(`Proxying request from ${req.headers.host} to ${target}`);
        proxy.web(req, res, { target }, (err) => {
            console.error(`Proxy error for ${req.headers.host}:`, err);
            res.writeHead(502);
            res.end("Bad Gateway");
        });
    } else {
        const proxied_domains_response = await Promise.all(JSON.parse(JSON.stringify(hostsFileItems)).map(async (entry) => {
            try {
                const result = await fetch('http://127.0.0.1:' + entry.port);
                entry.response = result.status;
            } catch (e) {
                entry.response = null;
            }

            return entry;
        }));

        res.setHeader("Content-Type", "application/json");
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.writeHead(200);
        res.end(JSON.stringify({
            proxy: "Lukes Local Hostfile Proxier",
            proxied_domains: proxied_domains_response
        }));
    }
});

process.on('SIGINT', () => {
    console.log("Shutting down proxy...");
    server.close(() => process.exit(0));
});

// Start the proxy server
server.listen(80, () => {
    console.log("Reverse proxy running on port 80");
});
