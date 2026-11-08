# QR camera

The check-in page reads a QR code with `@zxing/browser` in `apps/web/src/check-in/camera.tsx`. It uses the phone or desktop camera, or an image if the camera is blocked. The decoded text is sent to the server. The browser does not decide who gets in.

The payload is still the ticket id and secret from `qrPayloadText`. The secret is not shown and is not put in the URL.

The next ticket must not treat a decoded code as an admission by itself.
