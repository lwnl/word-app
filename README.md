# word-app

## Functions list:

	•	login: switch login page to index page – ok
	•	logout: switch index page to login page – ok
	•	Store new words – ok
	•	Avoid storing duplicate words – ok
	•	update category and numbers of words after adding and deleting – ok
	•	Search words – ok
	•	Real-time updating of search matches - ok
	•	Clear search results - ok
	•	Randomly display words – ok
	•	switch showing of words in Chinese and German – ok
	•	Delete a word and automatically add another one when available – ok
	•	Multiple users management - ok
	•	add a function to review words -ok
	•	add a function to change category - ok
	•	bcrypt encryption, JWT (JSON Web Token) and SECRET_KEY - ok
	•	学习和复习单词以单个单词形式显现
	•	点击添加，点击获取单词后，清空输入框 ok
	•	在添加单词时增加匹配和提示功能 
	•	查找后，有更改功能和编辑功能
	•	用axios请求
	•	更改自动匹配
	•	token方案：瞬间存储在cookie中并在后端设置 ok
		res.cookie('token', token, {
    httpOnly: true,  // 防止 JavaScript 访问
    secure: true,    // 仅通过 HTTPS 传输
    sameSite: 'Strict', // 防止 CSRF 攻击
    maxAge: 3600000  // 设置1小时有效期
  });
	•	修复更改类别和更改单词属性协调性
	•	https方案中的root certificate 和 reverse proxy的应用





 