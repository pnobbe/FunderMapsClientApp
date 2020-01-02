/**
 * Import Dependency
 */
import OrgUserModel from 'model/OrgUser'
import Vue from 'vue'

/**
 * Import API
 */
import orgUserAPI from 'api/orgUser'

/**
 * Declare Variable
 */
const state = {
  users : null
}

const getters = {
  orgUsers: state => {
    return state.users;
  },
  areOrganisationUsersAvailable: state => {
    return state.users !== null
  },
  getReviewers: state => {
    return state.users 
      ? state.users.filter(user => {
        return user.canReview()
      })
      : null;
  },
  getCreators: state => {
    return state.users 
    ? state.users.filter(user => {
      return user.canCreate()
    })
    : null;
  },
  getUserById: (state) => ({id}) => {
    return state.users.find(user => {
      return user.id === id
    })
  },
  getUserByEmail: (state) => ({email}) => {
    return state.users.find(user => {
      return user.email === email
    })
  }
}
const actions = {
  // FUTURE: We do not want to make 1+n remote calls.
  async getUsers({ commit }, { orgId }) {
    let response = await orgUserAPI.getOrganizationUsers({ orgId });
    if (response.status === 200 && response.data.length > 0) {
      await Promise.all(response.data.map(organizationUser => {
        return orgUserAPI.getOrganizationUserProfile({ orgId, id: organizationUser.userId }).then(result => {
          if (response.status === 200 && response.data) {
            return Object.assign(organizationUser, result.data)
          }
        })
      })).then(results => {
        commit('set_users', {
          users: results
        })
      })
    } 
  },
  async updateUser({ dispatch }, { orgId, userData, role }) {
    let response = await orgUserAPI.updateOrganizationUser({ orgId, user: userData, role })
    if (response.status === 204) {
      dispatch('getUsers', {
        orgId
      })
    }
    return response;
  },
  async createUser({ dispatch }, { orgId, userData, role }) {
    let response = await orgUserAPI.createOrganizationUser({ orgId, user: userData, role })
    if (response.status === 204) {
      dispatch('getUsers', {
        orgId
      })
    }
    return response;
  },
  async removeUser({ commit }, { orgId, id }) {
    let response = await orgUserAPI.removeOrganizationUser({ orgId, id })
    if (response.status === 204) {
      commit('remove_user', { id })
    }
  },
  clearUsers({ commit }) {
    commit('clear_users')
  }
}
const mutations = {
  set_users(state, { users }) {
    state.users = users.map(user => {
      return new OrgUserModel(user)
    })
  },
  update_user(state, { userData, role }) {
    let index = state.users.findIndex(user => {
      return user.id === userData.id
    })
    state.users[index] = userData;
    state.users[index].role = role
  },
  remove_user(state, { id }) {
    let index = state.users.findIndex(user => {
      return user.id === id
    })
    Vue.delete(state.users, index);
  },
  clear_users(state) {
    state.users = null
  }
}

/**
 * Export
 */
export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
}
