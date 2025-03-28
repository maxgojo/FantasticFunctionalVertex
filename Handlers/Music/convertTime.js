const { isEquatable } = require("discord.js");

module.exports = {
  convertTime: function(duration) {
    let milliseconds = parseInt(duration % 1000 / 100);
    let seconds = parseInt((duration / 1000) % 60);
    let minutes = parseInt((duration / (1000 * 60)) % 60);
    let hours = parseInt((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    if (duration < 3600000) {
      return minutes + ":" + seconds;
    } else {
      return hours + ":" + minutes + ":" + seconds;
    }
  },

  convertNumber: function(number, decPlaces) {
    decPlaces = Math.pow(10, decPlaces);
    let abbrev = ["K", "M", "B", "T"];
    for (let i = abbrev.length - 1; i >= 0; i--) {
      let size = Math.pow(10, (i + 1) * 3);
      if (size <= number) {
        number = Math.round(number * decPlaces / size) / decPlaces;

        if ((number === 1000) && (i < abbrev.length - 1)) {
          number = 1;
          i++;
        }
        number += abbrev[i];
        break;
      }
    }
    return number;
  },

  chunk: function(arr, size) {
    const temp = [];
    for (let i = 0; i < arr.length; i += size) {
      temp.push(arr.slice(i, i + size));
    }
    return temp;
  },

  convertHmsToMs: function(hms) {
    const a = hms.split(":");
    if (a.length < 3) {
      return (+a[0]) * 1000;
    } else if (a.length < 6) {
      return (((+a[0]) * 60 + (+a[1])) * 1000);
    } else {
      return (((+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])) * 1000);
    }
  }
};