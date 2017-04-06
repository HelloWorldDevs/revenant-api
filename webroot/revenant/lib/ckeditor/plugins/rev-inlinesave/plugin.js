CKEDITOR.plugins.add("inlinesave", {
  init: function (b) {
    console.log('inline save init!')
    var a = b.config.inlinesave, c;
    if (typeof a == "undefined") {
      throw new Error("CKEditor inlinesave: You must define config.inlinesave in your configuration file. See http://ckeditor.com/addon/inlinesave");
      return
    }
    c = !!a.useColorIcon ? "inlinesave-color.svg" : "inlinesave.svg";
    b.addCommand("inlinesave", {
      exec: function (f) {
        var d = {}, j = "", k = "application/x-www-form-urlencoded; charset=UTF-8";
        if (typeof a.postUrl == "undefined") {
          throw new Error("CKEditor inlinesave: You must define config.inlinesave.postUrl in your configuration file. See http://ckeditor.com/addon/inlinesave");
          return
        }
        if (typeof a.onSave == "function") {
          var i = a.onSave(f);
          if (typeof i != "undefined" && !i) {
            if (typeof a.onFailure == "function") {
              a.onFailure(f, -1, null)
            } else {
              throw new Error("CKEditor inlinesave: Saving Disable by return of onSave function = false")
            }
            return
          }
        }
        CKEDITOR.tools.extend(d, a.postData || {}, true);
        d.editabledata = f.getData();
        d.editorID = f.container.getId();
        if (!!a.useJSON) {
          j = JSON.stringify(d);
          k = "application/json; charset=UTF-8"
        } else {
          var h = "";
          for (var e in d) {
            h += "&" + e + "=" + encodeURIComponent(d[e])
          }
          j = h.slice(1)
        }
        var g = new XMLHttpRequest();
        g.onreadystatechange = function () {
          if (g.readyState == 4) {
            if (typeof a.onSuccess == "function" && g.status == 200) {
              a.onSuccess(f, g.response)
            } else {
              if (typeof a.onFailure == "function") {
                a.onFailure(f, g.status, g)
              }
            }
          }
        };
        g.open("POST", a.postUrl, true);
        g.setRequestHeader("Content-type", k);
        g.setRequestHeader("Authorization", a.postAuth);//added header postAuth
        g.send(j)
      }
    });
    b.ui.addButton("Inlinesave", {
      toolbar: "document",
      label: "Save",
      command: "inlinesave",
      icon: this.path + "images/" + c
    })
  }
});
