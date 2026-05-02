import axiosInstance from "./axiosInstance";

/**
 * Capa de abstracción para llamadas HTTP.
 * Usa axiosInstance que ya incluye el interceptor JWT.
 * Todos los endpoints protegidos deben llamarse a través de estos métodos.
 */
export class metodoRest {

    static async metodoGetData(pathApi) {
        const response = await axiosInstance.get(pathApi);
        return response.data;
    }

    static getAll = async (pathApi) => {
        return await axiosInstance
            .get(pathApi)
            .then((res) => res.data)
            .catch((e) => { throw e; });
    };

    static metodoPostData = async (pathApi, dataEnviar) => {
        return await axiosInstance({
            method: "post",
            url: pathApi,
            data: dataEnviar,
        })
            .then((response) => response)
            .catch((error) => { throw error; });
    };

    /**
     * POST público (sin JWT) — para el login contra el auth-service.
     */
    static metodoPostPublico = async (pathApi, dataEnviar) => {
        return await axiosInstance({
            method: "post",
            url: pathApi,
            data: dataEnviar,
            // Evita que el interceptor de 401 redirija en el login
            skipAuthRedirect: true,
        })
            .then((response) => response)
            .catch((error) => { throw error; });
    };
}
