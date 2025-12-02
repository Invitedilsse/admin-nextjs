import axios from "axios";

//==================|| AXIOS CONFIGURATION ||============//

export const getAccessToken = async () => {
  let token = localStorage.getItem("idToken");
  if (token) {
    console.log("token append");
    return token;
  } else {
    console.log("token null");

    return null;
  }
};

function removeAllCookies() {
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf("=");
    const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
}

axios.interceptors.response.use(null, (error) => {
  if (!error?.response?.config?.isNormal) {
    if (error && error.response) {
      if (error.response.status === 401) {
        // initial call to whoami will get intercepted here and redirect, need to throw log event
        // TODO: Do something
      }
      const { data } = error.response;
      if (data.message === "UnauthorizedError" && data.statusCode === 401) {
        localStorage.clear();
        removeAllCookies();
        // eslint-disable-next-line no-undef
        window.location.assign(process.env.REACT_APP_AUTH0_LOGOUT_REDIRECT_URI);
      }
      const errorPayload =
        data.errors ||
        data.error_message ||
        data.error_type ||
        data.message ||
        data;

      return Promise.reject(errorPayload);
    }

    return Promise.reject(error);
  } else {
    return Promise.reject(error.response.data);
  }
});
/**
 *
 * @param {*} path  endpoint
 * @returns data from api
 */
export async function apiGet(path) {
  const authToken = await getAccessToken();
  const config = {
    headers: {
      authorization: authToken ? `${authToken}` : null,
    },
  };
  return axios.get(path, config);
}

/**
 *
 * @param {*} path   endpoint
 * @param {*} data object of data
 * @returns   data from api
 */
export async function apiPost(path, data, isNormal = false) {
  const authToken = await getAccessToken();
  const config = {
    headers: {
      authorization: authToken ? `${authToken}` : null,
      "Content-Type": !isNormal ? "application/json" : "multipart/form-data",
    },
    isNormal: isNormal,
  };

  return axios.post(path, data, config);
}

/**
 *
 * @param {*} path   endpoint
 * @param {*} data object of data
 * @returns   data from api
 */

export async function apiPatch(path, data, headers = {}) {
  const authToken = await getAccessToken();
  const config = {
    headers: {
      authorization: `${authToken}`,
      ...headers,
    },
  };

  return axios.patch(path, data, config);
}
/**
 *
 * @param {*} path   endpoint
 * @param {*} data object of data
 * @returns   data from api
 */
export async function apiPut(path, data, isNormal = false) {
  const authToken = await getAccessToken();
  const config = {
    headers: {
      authorization: authToken ? `${authToken}` : null,
      // "Content-Type": "application/json",
    },
    isNormal: isNormal,
  };

  return axios.put(path, data, config);
}
/**
 *
 * @param {*} path   endpoint
 * @param {*} data params
 * @returns   data from api
 */
export async function apiDelete(path, data) {
  const authToken = await getAccessToken();
  // const config = {
  //   headers: {
  //     authorization: `${authToken}`
  //   }
  // };
  const headers = {
    authorization: `${authToken}`,
  };
  const config = {
    headers: {
      authorization: authToken ? `${authToken}` : null,
      "Content-Type": "application/json",
    },
  };
  // return axios.delete(path, {
  //   ...data,
  //   ...config
  // });
  // return axios.delete(path, { data: data, headers: headers });
  // return axios.delete(path, { data: data, config });
  return axios.delete(path, { headers, data: data });
}

/**
 *
 * @param {*} path   endpoint
 * @param {*} data object of data
 * @returns   data from api
 */
export function apiPostWithCustomToken(path, data, token) {
  const config = {
    headers: {
      authorization: token ? `Basic ${token}` : null,
      "Content-Type": "application/json",
    },
  };

  return axios.post(path, data, config);
}

const instance = axios.create();

export default instance;
