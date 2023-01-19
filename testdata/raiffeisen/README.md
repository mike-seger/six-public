
https://zinsalert.raiffeisen.ch/zinsalertapi/v1/SARONCompound

curl 'https://zinsalert.raiffeisen.ch/zinsalertapi/v1/SARONCompound' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Accept-Language: de' \
  -H 'Cache-Control: no-cache' \
  -H 'Connection: keep-alive' \
  -H 'Content-Type: application/json' \
  -H $'Cookie: dtCookie=$xc/PIg\u0021PYOuMjKJtYfClYNLP7poFgTb85\u0021s\u0021H4qnaQq8bhGKPVCLr\u0021N1JH6WvhDe3SfQCVO9YeAHV9ixL_\u0021FhVmPHXo6wI=; YPLTCQVMN-SID-S=AbjZa8Z4084kALKSPHseaOnQR3pxKm_YaVeNXTWyYGzQYmSinSdnIFwi6\u00217S9dJPkVkR; BIGipServer~sf0-2430-pmid~pool_TLS-EG_P_TMisc_10901-10903=$xc/eIOobKQ3dxCiB\u0021JMaSfMwcnNimNc3dyOQvdaHt84U_R9CPLx9sFipFFhtwxh\u0021NhC\u0021_8EI8a3_STl8NAoOaAEnUoe_4I=' \
  -H 'DNT: 1' \
  -H 'Origin: https://zinsalert.raiffeisen.ch' \
  -H 'Pragma: no-cache' \
  -H 'Referer: https://zinsalert.raiffeisen.ch/saron-rechner?language=de' \
  -H 'Sec-Fetch-Dest: empty' \
  -H 'Sec-Fetch-Mode: cors' \
  -H 'Sec-Fetch-Site: same-origin' \
  -H 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36' \
  -H 'apikey: c905d90a-4b85-4c8e-a10b-1985f987e1b4' \
  -H 'sec-ch-ua: "Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "macOS"' \
  --data-raw '{"startDate":"2023-01-01","endDate":"2023-01-04"}' \
  --compressed

curl 'https://zinsalert.raiffeisen.ch/zinsalertapi/v1/SARONCompound' \
  -H 'Accept: application/json, text/plain, */*' \
  -H 'Content-Type: application/json' \
  -H 'DNT: 1' \
  -H 'Origin: https://zinsalert.raiffeisen.ch' \
  -H 'Referer: https://zinsalert.raiffeisen.ch/saron-rechner?language=de' \
  -H 'apikey: c905d90a-4b85-4c8e-a10b-1985f987e1b4' \
  --data-raw '{"startDate":"2023-01-01","endDate":"2023-01-04"}'


POST /zinsalertapi/v1/SARONCompound HTTP/1.1
Accept: application/json, text/plain, */*
Accept-Encoding: gzip, deflate, br
Accept-Language: de
Cache-Control: no-cache
Connection: keep-alive
Content-Length: 49
Content-Type: application/json
Cookie: dtCookie=$xc/PIg!PYOuMjKJtYfClYNLP7poFgTb85!s!H4qnaQq8bhGKPVCLr!N1JH6WvhDe3SfQCVO9YeAHV9ixL_!FhVmPHXo6wI=; YPLTCQVMN-SID-S=AbjZa8Z4084kALKSPHseaOnQR3pxKm_YaVeNXTWyYGzQYmSinSdnIFwi6!7S9dJPkVkR; BIGipServer~sf0-2430-pmid~pool_TLS-EG_P_TMisc_10901-10903=$xc/eIOobKQ3dxCiB!JMaSfMwcnNimNc3dyOQvdaHt84U_R9CPLx9sFipFFhtwxh!NhC!_8EI8a3_STl8NAoOaAEnUoe_4I=
DNT: 1
Host: zinsalert.raiffeisen.ch
Origin: https://zinsalert.raiffeisen.ch
Pragma: no-cache
Referer: https://zinsalert.raiffeisen.ch/saron-rechner?language=de
Sec-Fetch-Dest: empty
Sec-Fetch-Mode: cors
Sec-Fetch-Site: same-origin
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36
apikey: c905d90a-4b85-4c8e-a10b-1985f987e1b4
sec-ch-ua: "Not?A_Brand";v="8", "Chromium";v="108", "Google Chrome";v="108"
sec-ch-ua-mobile: ?0
sec-ch-ua-platform: "macOS"

