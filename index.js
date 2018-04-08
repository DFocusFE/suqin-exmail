const querystring = require('querystring');
const JSONBigString = require('json-bigint')({ storeAsString: true });
const { Provider } = require('suqin');

const config = {
  baseUrl: 'https://api.exmail.qq.com',
  name: 'Exmail',
};

module.exports = class Dingtalk extends Provider {
  /**
   * 构造函数
   * @param {Object} opts 更多配置项
   */
  constructor(opts = { baseUrl: config.baseUrl }) {
    super(opts);

    if (typeof opts.corpId !== 'string') throw Error('Params Error: opts.corpId must be a String.');
    if (typeof opts.corpSecret !== 'string') throw Error('Params Error: opts.corpSecret must be a String.');

    // 在suqin体系中的代号/名称/key
    this.name = opts.name || config.name;
    // API Host
    this._apiHost = opts.baseUrl || config.baseUrl;
    // 腾讯企业邮箱授予的组织ID
    this._corpId = opts.corpId;
    // 腾讯企业邮箱授予的组织通讯录管理秘钥
    this._corpSecret = opts.corpSecret;
    // 缓存token
    this._token = {
      value: null,
      expires: null,
    };
  }

  get token() {
    const token = this._token;
    if (!token.expires || token.expires < +new Date()) {
      return this.getToken();
    }
    return token.value;
  }

  set token(val) {
    this._token = val;
    return this._token;
  }

  /**
   * 获取Token
   */
  async getToken() {
    return this.fetch({
      method: 'get',
      url: `${this._apiHost}/cgi-bin/gettoken?corpid=${this._corpId}&corpsecret=${this._corpSecret}`,
    })
      .then(res => {
        const token = res.data;
        const now = +new Date();
        this.token = {
          value: token.access_token,
          // 腾讯企业邮箱颁发的token有效期为7200秒
          // 提前 300秒 重新获取token
          expires: now + ((token.expires_in - 300) * 1000),
        };
        return token.access_token;
      });
  }

  /**
   * 请求参数构造器
   * 将基础参数进行封装, 用于适配suqin.fetch()
   * @param {Object} opts 基础参数
   */
  async fetchConfGenerator(opts = {}) {
    return {
      method: opts.method ? opts.method.toLowerCase() : 'get',
      url: `${opts.url}?${querystring.stringify({
        access_token: await this.token,
        ...opts.query,
      })}`,
      headers: opts.headers || {},
      data: opts.data,
      transformResponse: [data => {
        // return { rawData: data, formatData: JSON.parse(data) };
        let _data;
        try {
          _data = JSONBigString.parse(data);
        } catch (error) {
          _data = data;
        }
        return _data;
      }],
    };
  }

  /* eslint-disable class-methods-use-this */
  get readAPIs() {
    return {
      /**
       * 查询成员列表
       * @param {Object} opts 其余参数
       */
      async readMembers(opts = { department_id: 1 }) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._apiHost}/cgi-bin/user/list`,
          query: opts,
        }));
      },

      /**
       * 查询成员详情
       * @param {String} id   成员ID
       * @param {Object} opts 其余参数
       */
      async readMember(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._apiHost}/cgi-bin/user/get`,
          query: { ...opts, userid: id },
        }));
      },


      /**
       * 查询群组列表
       * @param {String} id 父部门id, 缺省值为1
       * @param {Object} opts 其余参数
       */
      async readGroups(id = 1, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._apiHost}/cgi-bin/department/list`,
          query: { ...opts, id },
        }));
      },

      /**
       * 查询群组详情
       * @param {String} name 部门名
       * @param {Object} opts 其余参数
       */
      async readGroup(name, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._apiHost}/cgi-bin/department/search`,
          query: opts,
          data: JSON.stringify({ name }),
        }));
      },

      // /**
      //  * 校验用户是否存在
      //  * @param {String} name 用户主邮箱 principalName
      //  * @param {String} pwd  用户密码
      //  * @return {Bolean} true: 存在, false: 不存在
      //  */
      // async verifiyMember(name, pwd) {
      //   const authUrl = `${this._authHost}/${this._tenlentId}/oauth2/token?api-version=1.0`;

      //   return this.fetch({
      //     method: 'post',
      //     url: authUrl,
      //     data: querystring.stringify({
      //       grant_type: 'password',
      //       resource: this._graphHost,
      //       client_id: this._clientId,
      //       username: name,
      //       password: pwd,
      //     }),
      //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      //   })
      //     .then(res => !!res.data.access_token);
      // },

    };
  }
  get writeAPIs() {
    return {
      /**
       * 创建成员
       * @param {Object} member 成员
       * @param {Object} opts   其余参数
       */
      async createMember(member, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._apiHost}/cgi-bin/user/create`,
          query: opts,
          data: JSON.stringify(member)
            // '{"department":["123", "456"]}' => '{"department":[123, 456]}'
            .replace(/:\[([^\]]+)\]/g, match => match.replace(/"/g, '')),
        }));
      },

      /**
       * 删除成员
       * @param {String} id   成员ID
       * @param {Object} opts 其余参数
       */
      async deleteMember(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._apiHost}/cgi-bin/user/delete`,
          query: { ...opts, userid: id },
        }));
      },

      /**
       * 修改成员
       * @param {String} id     成员ID
       * @param {Object} member 成员
       */
      async updateMember(id, member, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._apiHost}/cgi-bin/user/update`,
          query: opts,
          data: JSON.stringify({ ...member, userid: id })
            // '{"department":["123", "456"]}' => '{"department":[123, 456]}'
            .replace(/:\[([^\]]+)\]/g, match => match.replace(/"/g, '')),
        }));
      },

      /**
       * 创建群组
       * @param {Object} group 群组
       * @param {Object} opts  其余参数
       */
      async createGroup(group, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._apiHost}/cgi-bin/department/create`,
          query: opts,
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/plain',
          },
          data: JSON.stringify(group)
            // '{"parentid":"123"}' => '{"parentid":123}'
            .replace(/"parentid":"\w+",/g, match => match.replace(/:"/g, ':')
              .replace(/",/g, ',')),
        }));
      },

      /**
       * 删除群组
       * @param {String} id   群组ID
       * @param {Object} opts 其余参数
       */
      async deleteGroup(id, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          url: `${this._apiHost}/cgi-bin/department/delete`,
          query: { ...opts, id },
        }));
      },

      /**
       * 修改群组
       * @param {Object} id    群组ID
       * @param {Object} group 群组
       * @param {Object} opts  其余参数
       */
      async updateGroup(id, group, opts = {}) {
        return this.fetch(await this.fetchConfGenerator({
          method: 'post',
          url: `${this._apiHost}/cgi-bin/department/update`,
          query: opts,
          data: JSON.stringify({ ...group, id })
            // '{"id":"123","name":"XXX"}' => '{"id":123,"name":"XXX"}'
            .replace(/"id":"/g, '"id":')
            .replace(/"}/g, '}'),
        }));
      },
    };
  }
  /* eslint-enable class-methods-use-this */
};
