const db = require('./db')
const sanitizeHtml = require('sanitize-html')
var qs = require('querystring');

module.exports = {
	create: (req, res) => {
		db.query('select * from topic', (err, topics) => {
            if(err){ throw err}
			db.query('select * from author', (err2, authors) => {
				if (err2) { throw err2 }
				var i = 0;
                var tag = '<table border="1" style="border-collapse: collapse;">'
				for ( i=0; i<authors.length; i++) {
					tag += `<tr><td>${authors[i].name}</td><td>${authors[i].profile}</td>
                    <td><a href="/author/update/${authors[i].id}">update</a></td>
					<td><a href="/author/delete/${authors[i].id}" onclick='if(confirm("정말로 삭제하시겠습니까?")==false){return false}'>delete</a></td>`
				}
				tag += '</table>'

				var b = `<form action='/author/create_process' method='post'>
							<p><input type='text' name='name' placeholder='name'></p>
							<p><input type='text' name='profile' placeholder='profile'></p>
							<p><input type='submit' value='저자생성'></p>
						</form>`

				var context = { title : "AUTHOR 자료 생성",
					            login : '',
					            list: topics,
								menu: tag,
								body: b }
				res.render('home', context, (err, html) => res.end(html))
			})
	})
	},

	create_process : (req,res)=>{
        var body = '';
        req.on('data', (data)=>{
            body += data;
        });
        req.on('end',()=>{
            var post = qs.parse(body);
            var sanitizedName = sanitizeHtml(post.name);  
            var sanitizedProfile = sanitizeHtml(post.profile)  
            db.query(`insert into author (name, profile) 
                            values(?,?)`, 
                     [sanitizedName, sanitizedProfile],(error, result)=>{   //수정
                            if(error){
                                throw error
                            }
                            res.redirect(`/author`)
                            res.end();
            });   //첫번째 query 종료
        })
    },

	update: (req, res) => {
		var id = req.params.authorId
		db.query('select * from topic', (err, topics) => {
            if(err){
                throw err
            }
			db.query('select * from author', (err1, authors) => {
                if(err1){
                    throw err1
                }
				db.query('select * from author where id=?', [id], (err2, author) => {
					if (err2) { throw err2 }

					var tag = '<table border="1" style="border-collapse: collapse;">'
					for (let i=0; i<authors.length; i++) {
						tag += `<tr><td>${authors[i].name}</td>
                                <td>${authors[i].profile}</td>
                                <td><a href="/author/update/${authors[i].id}">update</a></td>
						        <td><a href="/author/delete/${authors[i].id}" onclick='if(confirm("정말로 삭제하시겠습니까?")==false){return false}'>delete</a></td></tr>`
					}
					tag += '</table>'
					
					var b = `<form action='/author/update_process' method='post'>
								<input type="hidden" name="id" value="${id}">
								<p><input type='text' name='name' placeholder='name' value='${author[0].name}'></p>
								<p><input type='text' name='profile' placeholder='profile' value='${author[0].profile}'></p>
								<p><input type='submit' value='수정'></p>
							</form>`
	
					var context = { list: topics,
									menu: tag,
									body: b }
					res.render('home', context, (err, html) => res.end(html))
				})
			})
		})
	},
	update_process: (req, res) => {
		var body = '';
        req.on('data', (data)=>{
            body += data;
        });
        req.on('end',()=>{
            var post = qs.parse(body);
            sanitizeName = sanitizeHtml(post.name)
            sanitizeProfile = sanitizeHtml(post.profile)
            db.query(`update author set name=?, profile=? where id=?`,
                [sanitizeName, sanitizeProfile, post.id], (err, result) => {
                    if (err) { throw err }
                    res.redirect('/author')
		    })  // query 메소드 종료
        })
	},

	delete_process: (req, res) => {
        var id = req.params.authorId
        db.query('select * from author join topic on topic.author_id=author.id where author.id=?', [id], (err, result) => {
            if (err) console.log(err)
            if (result == '') {
                db.query(`delete from author where id=?`, [id], (err, result) => {
                    if (err) console.log(err)
                    res.redirect(`/author`)
                })
            } else {
                res.send(`<script>alert('연결된 topic 자료가 있으므로 해당 저자를 삭제할 수 없습니다.');window.location='/author'</script>`)
            }
        })
		
	}
}