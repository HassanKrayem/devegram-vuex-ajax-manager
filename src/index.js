import axios from 'axios';

const ajaxManager = {
  namespaced: true,
  state: {
    token: null,
    services: {
      github: {
        url: 'https://github.com',
        port: '',
        apiVer: '',
        token: ''
      }
    },
    defaultHeaders: {
      'accept': 'application/json',
      'content-type': 'application/json'
    },
    loadingRequests: 0,
    debug: false,
    errorHandler: null,
    successHandler: null,
    finallyHandler: null
  },
  mutations: {
    // used for set new service or update existing ones
    SET_SERVICE (state, services) {
    	if (services.constructor !== Array) {
	      services = [services]
	    }

		services.forEach((service) => {
			let c = service.config
			state.services[service.name] = {...c}
			state.services[service.name].path = c.url + (c.port? ':' + c.port : '') + (c.apiVer? '/' + c.apiVer : '')
		})
    },
    SET_ERROR_HANDLER (state, func) {
      state.errorHandler = func
    },
    SET_SUCCESS_HANDLER (state, func) {
      state.successHandler = func
    },
    SET_FINALLY_HANDLER (state, func) {
      state.finallyHandler = func
    },
    SET_DEBUG (state, status) {
      state.debug = status
    },
    SET_TOKEN (state, params) {
      state.token = params.token
    },
    LOADER_INCREMENT (state, params) {
      state.loadingRequests++;
    },
    LOADER_DECREMENT (state, params) {
      state.loadingRequests--;
    },
    SET_DEFAULT_HEADERS (state, headers) {
      state.defaultHeaders = headers
    }
  },
  actions: {
    setService ({ commit }, params) {
      commit('SET_SERVICE', params)
    },
    setErrorHandler ({ commit }, func) {
      commit('SET_ERROR_HANDLER', func)
    },
    setSuccessHandler ({ commit }, func) {
      commit('SET_SUCCESS_HANDLER', func)
    },
    setFinallyHandler ({ commit }, func) {
      commit('SET_FINALLY_HANDLER', func)
    },
    setDebug ({ commit }, status) {
      commit('SET_DEBUG', status)
    },
    setToken ({ commit }, params) {
      commit('SET_TOKEN', params)
    },
    loaderIncrement ({ commit }, params) {
      commit('LOADER_INCREMENT', params)
    },
    loaderDecrement ({ commit }, params) {
      commit('LOADER_DECREMENT', params)
    },
    setDefaultHeaders ({ commit }, headers) {
      commit('SET_DEFAULT_HEADERS', headers)
    },
    api ({state, dispatch}, params) {

      let url = params.url
      let headers = params.headers || {};
      const service = state.services[params.service];
      if (service) {
        url = service.path + url
      }
      

      if (!params.hasOwnProperty('noDefaultHeaders')) {
       headers = {
        ...headers,
        ...state.headers
       }
      }

      if (!params.hasOwnProperty('noToken') && !params.hasOwnProperty('noService')) {
        let token = null
        if (params.token) {
          token = params.token
        } else if (service.token) {
          token = params.token
        } else {
          token = state.token
        }
        
        headers.Authorization = 'Bearer ' + token
      }

      const request = {
        method: params.verb,
        url,
        data: params.data,
        headers: headers,
        crossDomain: params.crossDomain
      }

      if (params.responseType) {
        request.responseType = params.responseType;
      }

      if (!params.hasOwnProperty('noLoadingScreen')) {
        dispatch('loaderIncrement');
      }

      return new Promise((resolve, reject) => {
        axios(request).then(response => {
			if (typeof state.successHandler === 'function') state.successHandler(response)
			resolve(response);
        }, error => {
          if (params.hasOwnProperty('onError')) {
            params.onError(error)
          } else {
            if (typeof state.errorHandler === 'function') state.errorHandler(error)
            if (state.debug) console.error('AJAX MANAGER API ERROR: ', error)
            reject(error);
          }
        }).finally(() => {
          if (!params.hasOwnProperty('noLoadingScreen')) {
            dispatch('loaderDecrement')
          }
        })
      })
    }
  }
}

export default ajaxManager
