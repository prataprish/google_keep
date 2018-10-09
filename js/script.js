
document.addEventListener('DOMContentLoaded', function(){
    var keep_body = document.getElementById('keep_body');
    if(!localStorage){
      keep_body.setAttribute('loc','views/error.html');
    } else{
      var user = localStorage.getItem('username');
      if(user){
        keep_body.setAttribute('loc','views/home.html');
        setTimeout(function(){
          setOperations();
        },100);
      } else{
        keep_body.setAttribute('loc','views/signup.html');
      }
    }
    myHTMLInclude();
}, false);


function signUp() {
  read('js/users.json',function(data){
    var user,pass,error,reply;
    error = document.getElementById('errorMsg');
    pass = document.getElementById('password').value;
    user = document.getElementById('username').value;
    reply = JSON.parse(data);
    if(reply.user == user && reply.pass == pass){
      localStorage.setItem('username',reply.user);
      keep_body.setAttribute('loc','views/home.html');
      myHTMLInclude();
      location.reload();
    } else{
      alert('Please Enter Correct Details');
    }
  });
}

function myHTMLInclude() {
  var list, file, xhttpreq;
  list = document.getElementsByTagName("*");
  for (var i = 0; i < list.length; i++) {
    if (list[i].getAttribute("loc")) {
      var cur = list[i].cloneNode(false);
      file = list[i].getAttribute("loc");
      var xhttpreq = new XMLHttpRequest();
      xhttpreq.onreadystatechange = function() {
        if (xhttpreq.readyState == 4 && xhttpreq.status == 200) {
          cur.removeAttribute("loc");
          cur.innerHTML = xhttpreq.responseText;
          list[i].parentNode.replaceChild(cur, list[i]);
          myHTMLInclude();
        }
      }
      xhttpreq.open("GET", file, true);
      xhttpreq.send();
      return;
    }
  }
}

function read(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}


function makeWay(ele,edit,def = true) {
  if(def){
    var non_visible = document.getElementsByClassName('d-none');
    for (var i = 0; i < non_visible.length; i++) {
      non_visible[i].style.display = 'inline-block';
    }
    ele.remove();
    edit.setAttribute('contenteditable',true);
    edit.focus();
  } else{
    ele.remove();
    edit.innerHTML = '';
    edit.focus();
  }
}

function setOperations() {

  var db = openDatabase('notes', '1.0', 'notes data', 2 * 1024 * 1024);

  db.transaction(function (tx) {
    // console.log(tx);
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (user,note,title,label,color,time)');
    tx.executeSql('CREATE TABLE IF NOT EXISTS labels (label,color)');
    tx.executeSql('SELECT rowid,* FROM labels', [], function (tx, results) {
       var len = results.rows.length;
       var nav = document.getElementById('nav');
       var init_labels = document.getElementById('init_label');
       var edit_labels = document.getElementById('edit_label');
       for (let i = 0; i < len; i++) {
          nav.innerHTML += '<div class="pointer" onclick="edit_label('+results.rows[i].rowid+')"><span class="col-2 tag_name">&#x2771;</span>'+results.rows[i].label+'</div>';
          init_labels.innerHTML += '<option value = "'+results.rows[i].rowid+'">'+results.rows[i].label+'</option>';
          edit_labels.innerHTML += '<option value = "'+results.rows[i].rowid+'">'+results.rows[i].label+'</option>';
       }
       nav.innerHTML += '<div class="pointer"><span data-id="all" class="col-2 tag_name">&#x2771;</span>All</div>';
       nav.innerHTML += '<div class="pointer" onclick="document.getElementById(\'overlay-tag\').style.display = \`block\`"><span class="col-2">&#x271B;</span> New Tag</div>';

    }, null);
    tx.executeSql('SELECT rowid,* FROM notes order by rowid desc', [], function (tx, results) {
       var len = results.rows.length;
       var nav = document.getElementById('main_body');
       for (let i = 0; i < len; i++) {
         var color = results.rows[i].color;
         if(results.rows[i].label){
           tx.executeSql('select rowid,* from labels where rowid='+results.rows[i].label,[],function(tx,r){
             color = r.rows[0].color;
           });
         }
          nav.innerHTML += '<div class="note editable-notes" onclick="edit_note(this,'+results.rows[i].rowid+')" style="background:'+color+'" data-id="'+results.rows[i].rowid+'"><div id="note-status-'+results.rows[i].rowid+'"></div><div class="col-12 title">'+results.rows[i].title+'</div><div class="col-12" >'+results.rows[i].note+'</div></div>';
          if(!results.rows[i].title && !results.rows[i].note){
            document.getElementById('note-status-'+results.rows[i].rowid).innerHTML = "Empty Note";
          }
          if(results.rows[i].label){
            var status = "";
            tx.executeSql('select rowid,label,color from labels where rowid ='+results.rows[i].label, [], function(tx, result) {
              document.getElementById('note-status-'+results.rows[i].rowid).innerHTML += "<span class='tag' style='"+"background:"+result.rows[0].color+"'>"+result.rows[0].label+"</span>";
            });
          }
       }

    }, null);
  });


}

function save_note(){
  var db = openDatabase('notes', '1.0', 'notes data', 2 * 1024 * 1024);
  db.transaction(function(tr) {
    tr.executeSql('SELECT * FROM notes', [], function (tx, results) {
       let insert_query = 'INSERT INTO notes values(?,?,?,?,?,?)';
       var temps = document.getElementsByClassName('np-text');
       for (var i = 0; i < temps.length; i++) {
         temps[i].remove();
       }
       tr.executeSql(insert_query,
         [
           localStorage.getItem('username'),
           document.getElementById('input_body').innerHTML,
           document.getElementById('input_title').innerHTML,
           document.getElementById('init_label').value,
           document.getElementById('color').value,
           null
         ]);
       keep_body.setAttribute('loc','views/home.html');
       myHTMLInclude();
       setOperations();
     }, null);
  });
}

function changeDefColor(color,whom){
  document.getElementsByClassName(whom)[0].style.backgroundColor = color;
}

function edit_note(ele,id){
  ele.style.visibility = 'hidden';
  var db = openDatabase('notes', '1.0', 'notes data', 2 * 1024 * 1024);
  db.transaction(function(tr) {
    tr.executeSql('SELECT * FROM notes where rowid = '+id, [], function (tx, results) {

      if(results.rows[0].title || results.rows[0].note){
        if(results.rows[0].title){
          document.getElementById('input_title_sec').innerHTML = results.rows[0].title;
        }
        if(results.rows[0].note){
          document.getElementById('input_body_sec').innerHTML = results.rows[0].note;
        }
        if(results.rows[0].label){
          document.getElementById('edit_label').value = results.rows[0].label;
        }
      } else{
        if(results.rows[0].title){
          document.getElementById('input_title_sec').innerHTML = '<span class="title np-text-sec" onclick="makeWay(this,document.getElementById(\'input_title_sec\'),false)">Title</span>';
        }
        if(results.rows[0].note){
          document.getElementById('input_body_sec').innerHTML = '<span class="sample-text np-text-sec" onclick="makeWay(this,document.getElementById(\'input_body_sec\'),false)">Take a note...</span>'
        }
      }
      if(results.rows[0].color){
        document.getElementById('color_sec').value = results.rows[0].color;
      }
    });
  });
  document.getElementsByClassName('overlay')[0].style.display = "block";

  document.getElementById('sec-close').addEventListener('click',function(){
    document.getElementsByClassName('overlay')[0].style.display = "none";
    ele.style.visibility = 'visible';
  }, false);

  document.getElementById('sec-save').addEventListener('click',function(){
    db.transaction(function(tr) {
      tr.executeSql('DELETE FROM notes where rowid ='+id);
    });
    var temps = document.getElementsByClassName('np-text');
    for (var i = 0; i < temps.length; i++) {
      temps[i].remove();
    }
    document.getElementsByClassName('overlay')[0].style.display = "none";
    document.getElementById('input_title').innerHTML = document.getElementById('input_title_sec').innerHTML;
    document.getElementById('input_body').innerHTML = document.getElementById('input_body_sec').innerHTML;
    document.getElementById('init_label').value = document.getElementById('edit_label').value;
    document.getElementById('color').value = document.getElementById('color_sec').value;
    save_note();
  }, false);
}

function nav(){
  var nav = document.getElementById('nav');
  var main_body = document.getElementById('main_body');
  if(nav.style.left == '0px'){
    nav.style.left = '-200px';
    main_body.style.left = "0px";
    main_body.style.width = '100%';
  } else{
    main_body.style.width = 'calc(100% - 200px)';
    main_body.style.left = "200px";
    nav.style.left = '0px';
  }
}

function new_tag(id) {
  var over = document.getElementById('overlay-tag');
  var name = document.getElementById('new_tag_name').innerHTML;
  var color = document.getElementById('color_tag').value;
  var db = openDatabase('notes', '1.0', 'notes data', 2 * 1024 * 1024);
  db.transaction(function(tr) {
    var check = false;
    tr.executeSql('select * from labels where label="'+name+'"',[], function(tr,res){
      // alert(res.rows.length);
      if(res.rows.length == 0){
        check = true;
      }
    });
    if(check){

      if(id == '0'){
        tr.executeSql('INSERT INTO labels values("'+name+'","'+color+'")');
      } else{
        tr.executeSql('UPDATE labels set label = "'+name+'", color = "'+color+'" where rowid='+id);
      }
    } else{
      alert('Sorry label name is already in use');
    }
  });
  keep_body.setAttribute('loc','views/home.html');
  myHTMLInclude();
  setOperations();
}

function edit_label(id){
  var db = openDatabase('notes', '1.0', 'notes data', 2 * 1024 * 1024);
  db.transaction(function(tr) {
    tr.executeSql('select rowid,* from labels where rowid='+id,[], function(tx, result){
      document.getElementById('new_tag_name').innerHTML = result.rows[0].label;
      document.getElementById('color_tag').value = result.rows[0].color;
      document.getElementById('tag-save').setAttribute('data-id',result.rows[0].rowid);
      document.getElementById('overlay-tag').style.display = "block";

    });
  });
}
