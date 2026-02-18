/opt/centrifugo/docker-cmds.txt has commands to run docker
/opt/centrifugo/config.json is a config file

when I change config file, to restart the docker container
```
docker restart centrifugo
```

to check the logs
```
docker logs -f centrifugo
```



debug in webhook-rpc.php :

```

// error_log('webhook-rpc: ' . print_r($data['meta']['sesskey'], true));
// error_log('session: '.print_r($_SESSION['USER'], true));

Array\n(\n
[Host] => c1d9-85-241-14-165.ngrok-free.app\n
[User-Agent] => Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36\n
[Content-Length] => 269\n
[Accept-Encoding] => gzip\n
[Content-Type] => application/json\n
[Origin] => https://c1d9-85-241-14-165.ngrok-free.app\n
[X-Forwarded-For] => 85.241.14.165, 141.101.98.116, 195.200.253.243\n
[X-Forwarded-Host] => c1d9-85-241-14-165.ngrok-free.app\n
[X-Forwarded-Proto] => https\n
[X-Moodle-Key] => meow\n
[X-Real-Ip] => 141.101.98.116\n)\n

```