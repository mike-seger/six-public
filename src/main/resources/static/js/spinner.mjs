/* Loader */
var Loader = {

  spinner: null,
  body: null,
  html: '<span><svg width="40" height="40" version="1.1" xmlns="http://www.w3.org/2000/svg"><circle cx="20" cy="20" r="15"></svg></span>',
  cssClass: "spinner",
  check: function () {
    if (this.body == null) {
      this.body = document.body;
    }
  },
  open: function () {
    this.check();
    if (!this.isOpen()) {
      this.spinner = document.createElement("div");
      this.spinner.setAttribute("id", "spinner");
      this.spinner.classList.add("spinner_website");
      this.spinner.innerHTML = this.html;
      this.body.append(this.spinner);
      this.body.classList.add(this.cssClass);
    }
    return this;
  },
  close: function () {
    this.check();
    if (this.isOpen()) {
      this.body.classList.remove(this.cssClass);
      this.spinner.remove();
    }
    return this;
  },
  isOpen: function () {
    this.check();
    return this.body.classList.contains(this.cssClass);
  },
  ifOpened: function (callback, close) {
    this.check();
    if (this.isOpen()) {
      if (!!close) this.close();
      if (typeof callback === "function") {
        callback();
      }
    }
    return this;
  },
  ifClosed: function (callback, open) {
    this.check();
    if (!this.isOpen()) {
      if (!!open) this.open();
      if (typeof callback === "function") {
        callback();
      }
    }
    return this;
  },
};


export { Loader }
