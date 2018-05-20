const cpjax = require("cpjax");

let params = new URLSearchParams(document.location.search.substring(1));
let urlToken = params.get("token");
if (urlToken) {
  sessionStorage.setItem("discordToken", urlToken);
  window.history.replaceState({}, document.title, "/");
}

// socket.io
const socket = io();

// Data
socket.on("queue:populate", function(queue) {
  if (queue.length > 0) {
    app.queue = queue;
    app.state.queue = queue.length;
    console.log(`🤖 -- Queue populated with ${queue.length} item(s).`);
  }
});
socket.on("queue:add-item", function(item) {
  app.queue.push(item);
});
socket.on("queue:remove-item", function(item) {
  let itemLocation = app.queue
    .map(function(e) {
      return e.queueId;
    })
    .indexOf(item.queueId);

  app.queue.splice(itemLocation, 1);
});

// State
socket.on("connect", function() {
  app.state.socket = "connected";
});
socket.on("connect_error", function() {
  app.state.socket = "disconnected";
});
socket.on("reconnect_error", function() {
  app.state.socket = "disconnected";
});
socket.on("reconnect_failed", function() {
  app.state.socket = "disconnected";
});
socket.on("reconnect_attempt", function() {
  app.state.socket = "connecting";
});

Vue.config.devtools = true;

var app = new Vue({
  el: "#app",
  data: {
    token: null,
    user: {},
    channels: {},
    state: {
      queue: 0,
      socket: "disconnected",
      isRandomSoundSelected: false,
      noSoundSelected: true,
      selectedSound: {},
      selectedTextChannel: null,
      selectedVoiceChannel: null,
      libraryFilter: ""
    },
    socket: {
      error: false
    },
    queue: [],
    library: [
    ]
  },
  computed: {
    filteredLibrary() {
      if (this.state.libraryFilter === "") return this.library;

      return this.library.filter(sound => {
        let id = sound.id.toLowerCase();
        let description = sound.description.toLowerCase();

        return (
          id.indexOf(this.state.libraryFilter.toLowerCase()) > -1 ||
          description.indexOf(this.state.libraryFilter.toLowerCase()) > -1
        );
      });
    },
    avatarImage() {
      if (this.user.id !== undefined)
        return {
          backgroundImage: `url(https://cdn.discordapp.com/avatars/${
            this.user.id
          }/${this.user.avatar}.png`
        };
    }
  },
  watch: {
    "state.queue": function(val, oldVal) {
      countItUp("queue-count", oldVal, val);
    },
    queue: function(val, oldVal) {
      this.state.queue = val.length;
    }
  },
  created: function() {
    this.tokenCheck();
    this.getChannels();
  },

  methods: {
    resetState: function() {
      this.state.isRandomSoundSelected = false;
      this.state.noSoundSelected = true;
      this.state.selectedSound = {};
    },
    tokenCheck: function() {
      var tokenPresence = sessionStorage.getItem("discordToken");
      if (tokenPresence) {
        this.token = tokenPresence;
        this.getUserDetails(tokenPresence);
      }
    },
    getChannels: function() {
      var self = this;
      cpjax(
        {
          url: "/api/discord/channels",
          requestedWith: false
        },
        (err, data) => {
          if (err) return console.error(err);

          let parsed = JSON.parse(data);
          self.channels = parsed;
          if (self.state.selectedVoiceChannel === null)
            self.state.selectedVoiceChannel = parsed.voice[0].id;

          if (self.state.selectedTextChannel === null)
            self.state.selectedTextChannel = parsed.text[0].id;
        }
      );
    },
    getUserDetails: function(discordToken) {
      var self = this;
      if (discordToken.length > 0) {
        cpjax(
          {
            url: "https://discordapp.com/api/users/@me",
            auth: `Bearer ${discordToken}`,
            requestedWith: false
          },
          (err, data) => {
            if (err) return console.error(err);
            self.user = JSON.parse(data);
          }
        );
      }
    },
    logoutUser: function() {
      sessionStorage.removeItem("discordToken");
      window.location.replace("/auth/discord");
    },
    playRandomSound: function() {
      // check for "last sound queued at"
      // if ok, POST
      // if not, set error somewhere?
      var channel = this.state.selectedVoiceChannel;
      cpjax(
        {
          method: "POST",
          url: `/command/randomsound/${channel}`
        },
        (err, data) => {
          if (err) return console.error(err);
        }
      );
    },
    playSound: function() {
      // check for "last sound queued at"
      // if ok, POST
      // if not, set error somewhere?
      var selectedSound = this.state.selectedSound;
      var channel = this.state.selectedVoiceChannel;
      cpjax(
        {
          method: "POST",
          url: `/command/playsound/${channel}`,
          data: JSON.stringify(selectedSound)
        },
        (err, data) => {
          if (err) return console.error(err);
        }
      );
    },
    textSentence: function() {
      var channel = this.state.selectedTextChannel;
      var author = this.user.username;
      cpjax(
        {
          method: "POST",
          url: `/command/sentence/${channel}`,
          data: author
        },
        (err, data) => {
          if (err) return console.error(err);
        }
      );
    },
    ttsSentence: function() {
      var channel = this.state.selectedTextChannel;
      var author = this.user.username;
      cpjax(
        {
          method: "POST",
          url: `/command/tts-sentence/${channel}`,
          data: author
        },
        (err, data) => {
          if (err) return console.error(err);
        }
      );
    }
  },
  mounted: function() {
    // this.updateData = setInterval(this.fetchData, 1000 * 60 * 2);
  },
  beforeDestroy: function() {
    // clearInterval(this.updateData);
  }
});

var countItUp = function(el, oldValue, newValue) {
  var counter = new CountUp(el, oldValue, newValue, 0, 2, {
    useEasing: true,
    useGrouping: true,
    separator: ",",
    decimal: "."
  });
  counter.start();
};
