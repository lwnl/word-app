var sqlite3 = require('sqlite3').verbose(); //引入

var db = new sqlite3.Database(__dirname + '/peoples.db');// 连接数据库，创建或者覆盖peoples.db数据库文件

exports.create = function () {
  db.serialize(function () {
    db.run("CREATE TABLE people (id int, name vachar(10), info TEXT)"); //数据库表结构

    var stmt = db.prepare("INSERT INTO people VALUES (?,?,?)"); //生成可插入数据的变量
    for (var i = 0; i < 10; i++) {
      stmt.run(i, "lili" + i, "Ipsum " + i); 
    } //插入了10条数据
    stmt.finalize();//关掉

    db.each("SELECT * FROM people", function (err, row) {
      if (err) {
      } else {
        console.log(row);
      }
    }) //查询功能
    db.close(); //关闭数据库
  })
}

exports.all = function() {
  db.serialize(function() {
    db.all('select * from lorem', function(err,row) {
      console.log(row)
    })
    db.close()
  })
  db.close()
}