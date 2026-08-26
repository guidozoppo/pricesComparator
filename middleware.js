export default function middleware(request) {
    const authorization = request.headers.get("authorization");

    if (!authorization) {
        return new Response("Autenticación requerida", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Comparador de Precios"',
            },
        });
    }

    const [type, credentials] = authorization.split(" ");

    if (type !== "Basic" || !credentials) {
        return new Response("Autenticación requerida", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Comparador de Precios"',
            },
        });
    }

    const decoded = atob(credentials);
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
        return new Response("Credenciales inválidas", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Comparador de Precios"',
            },
        });
    }

    const username = decoded.substring(0, separatorIndex);
    const password = decoded.substring(separatorIndex + 1);

    if (
        username !== process.env.APP_USERNAME ||
        password !== process.env.APP_PASSWORD
    ) {
        return new Response("Credenciales inválidas", {
            status: 401,
            headers: {
                "WWW-Authenticate": 'Basic realm="Comparador de Precios"',
            },
        });
    }

    return;
}