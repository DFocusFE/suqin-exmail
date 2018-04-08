
const { env } = require('process');
const Suqin = require('suqin');
const Exmail = require('../index');

const { Provider } = Suqin;
const _opts = {
  corpId: env.EXMAIL_CORP_ID,
  corpSecret: env.EXMAIL_ADDRESS_LIST_SECRET,
};

/* global should */

describe('Class', () => {
  describe('base testing', () => {
    const directories = new Suqin();
    const plugin = new Exmail(_opts);
    directories.use(plugin);
    it('Plugin is extend by Provider', done => {
      plugin.should.be.an.instanceof(Provider);
      done();
    });
    it('An instance of Exmail has the attributes.', done => {
      plugin.should.have.properties(['name', '_apiHost', '_corpId', '_corpSecret', '_token']);
      done();
    });
    it('Plugin can get token', () => {
      return plugin.getToken()
        .then(token => {
          token.should.be.a.String();
          plugin._token.value.should.be.a.String();
        });
    });
    it('Plugin.token must be a string', () => {
      return plugin.token.should.be.a.String();
    });
    it('Plugin can generate fetch config data', () => {
      return plugin.fetchConfGenerator()
        .then(data => {
          data.should.be.an.Object();
        });
    });
  });
});

describe('Verifiy', () => {
  it('The corpId should be a string', done => {
    (() => new Exmail(Object.assign({}, _opts, { corpId: 123 }))).should.throw(/corpId/i);
    done();
  });
  it('The corpSecret should be a string', done => {
    (() => new Exmail(Object.assign({}, _opts, { corpSecret: 123 }))).should.throw(/corpSecret/i);
    done();
  });
  it('The instantiation process needs to be reported wrong', done => {
    should(() => new Exmail()).throw();
    done();
  });
});

describe('Exercise', () => {
  const directories = new Suqin();
  const plugin = new Exmail(_opts);
  directories.use(plugin);

  const stamp = +new Date();
  const cache = {};
  const member = {
    name: `TestName${stamp}`,
    mobile: `1381234${stamp % 10000}`,
    department: ['1'],
    userid: `TestEmail${stamp}@memodown.com`,
    password: '123454678_Ta',
  };

  const group = {
    name: `Test${stamp}`,
    parentid: '1',
    order: 0,
  };

  // About member
  it('Plugin can create a member', () => {
    return directories.createMember(plugin.name, member)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
      });
  });

  it('Plugin can update a member', () => {
    return directories.updateMember(plugin.name, member.userid, { displayName: `CHANGED_${stamp}` })
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
      });
  });

  it('Plugin can read members', () => {
    return directories.readMembers({ department_id: 1 })
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.userlist.should.be.an.Array();
      });
  });

  it('Plugin can read members without `department_id`', () => {
    return directories.readMembers()
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.userlist.should.be.an.Array();
      });
  });

  it('Plugin can read a member', () => {
    return directories.readMember(member.userid)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.userid.should.be.a.String();
      });
  });

  // it('Plugin can verifiy a member', () => {
  //   return directories.verifiyMember(plugin.name, member.userPrincipalName, member.passwordProfile.password)
  //     .then(res => {
  //       res.should.equal(true);
  //     });
  // });

  it('Plugin can delete a member', () => {
    return directories.deleteMember(plugin.name, member.userid)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
      });
  });

  // About group
  it('Plugin can create a group', () => {
    return directories.createGroup(plugin.name, group)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.id.should.be.a.String();
        cache.groupId = res.data.id;
      });
  });

  it('Plugin can update a group', () => {
    return directories.updateGroup(plugin.name, cache.groupId, { name: `CHANGED_${stamp}` })
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
      });
  });

  it('Plugin can read groups', () => {
    return directories.readGroups()
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.department.should.be.an.Array();
      });
  });

  it('Plugin can read a group', () => {
    return directories.readGroup(group.name)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
        res.data.department.should.be.an.Array();
      });
  });

  it('Plugin can delete a group', () => {
    return directories.deleteGroup(plugin.name, cache.groupId)
      .then(res => {
        res.status.should.equal(200);
        res.data.should.be.an.Object();
        res.data.errcode.should.equal(0);
      });
  });
});
