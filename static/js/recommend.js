(function() {
	var recommendUrl = "http://api.assistant.miui.com/passage/recommend";
	var segmentUrl = "http://api.assistant.miui.com/passage/segmentAndRecognize";

	if (location.href.indexOf("staging") >= 0) {
		recommendUrl = "http://staging.shenghuo.xiaomi.com/assist/passage/v1/recommend";
		segmentUrl = "http://staging.shenghuo.xiaomi.com/assist/passage/v1/segment";
	}

	var historyIds = [];

	var Cookie = (function () {
		return {
			set: function (key, value, options) {

				options = options || {};

				if (value === null) {
					options.expires = -1;
				}

				var days = options.expires;
				if (typeof options.expires === 'number') {
					var t = options.expires = new Date();
					t.setDate(t.getDate() + days);
				} else if (typeof options.expires === 'string') {
					options.expires = new Date(days);
				}

				value = String(value);

				return document.cookie = [
					encodeURIComponent(key), '=', encodeURIComponent(value),
					options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
					options.path ? '; path=' + options.path : '',
					options.domain ? '; domain=' + options.domain : '',
					options.secure ? '; secure' : ''
				].join('')
			},
			get: function (n) {
				var m = document.cookie.match(new RegExp("(^| )" + n + "=([^;]*)(;|$)"));
				return !m ? "" : decodeURIComponent(m[2]);
			}
		}
	})();

	
	function renderResult(data, title) {
		var html = "";
		var tables = ["book", "celebrity", "merchant", "movie", "tvplay"];
		if (data && data.length > 0) {
			html = "<h5 class='sec'>" + title + "：</h5><div>";
			var items = [];
			for (var i = 0; i < data.length; i++) {
				if (tables.indexOf(data[i].pos) >= 0){
					items.push("<span class='bingo-w'>" + data[i].word + "(" + data[i].pos + ")</span>");
				}else if(data[i].tag&&data[i].tag!=="O"){
					items.push("<span class='bingo-w'>" + data[i].word + "(" + data[i].tag + ")</span>");
				} else {
					items.push(data[i].word);
				}
			}
			html += items.join("  ");
			html += "</div>";
		}
		return html;
	}

	function renderRecommendation(data) {
		var html = "<h5 class='sec'>推荐结果：</h5>";
		if (Object.keys(data).length == 0) {
			html += "<div>无</div>"
		}
		for (var i in data) {
			html += "<div class='cate'>" + i + "</div><table class='table'><thead><th>操作</th><th>name</th><th>split_word</th>";
			var keys = [];
			for (var key in data[i][0]) {
				if (key != "title" && key != "split_word" && key != "mid" && key != "create_time" && key != "update_time") {
					html += "<th>" + key + "</th>";
					keys.push(key);
				}
			}
			html += "</thead><tbody>";
			for (var j = 0; j < data[i].length; j++) {
				html += "<tr data-mid='" + data[i][j]['mid'] + "'><td><input name='checkbox' type='checkbox' value='" + data[i][j]['title'] + "/" + data[i][j]['cat'] + "'/><td><div style='white-space: nowrap;'>" + data[i][j]['title'] + "</div></td><td>" + handleWords(data[i][j]['split_word'], true) + "</td>";
				for (var k = 0; k < keys.length; k++) {
					var key = keys[k];
					if ((key == "introduction" || key=="description") && data[i][j][key].length > 10) {
						html += "<td ata-toggle='tooltip' data-placement='top' title='" + data[i][j][key] + "'>" + data[i][j][key].substr(0, 10) + "...</td>";
					} else if (key.indexOf("url") >= 0) {
						html += data[i][j][key] ? "<td data-toggle='tooltip' data-placement='top' title='" + data[i][j][key] + "'><a href='" + data[i][j][key] + "' target='_blank'>链接</a></td>" : "<td></td>";
					} else if (key.indexOf("icon") >= 0) {
						if (!data[i][j][key]) {
							data[i][j][key] = "http://i2.market.mi-img.com/thumbnail/png/w70/FoundApp/f8de0a8d-21c1-445a-8972-40a2ad96fcf7"
						} else if (data[i][j][key].indexOf("O2O") >= 0 && data[i][j][key].indexOf("market") < 0) {
							data[i][j][key] = "http://i2.market.mi-img.com/thumbnail/png/w70/" + data[i][j][key];
						}
						html += "<td><img width='70px' src='" + data[i][j][key] + "'/></td>";
					} else if (key == "writers" || key == "stars" || key == "directors" || key == "translators") {
						html += "<td>" + handleJSON(data[i][j][key]) + "</td>";
					} else if (key != "title" && key != "split_word" && key != "mid" && key != "create_time" && key != "update_time") {
						html += "<td>" + data[i][j][key] + "</td>";
					}
				}
				html += "</tr>";
			}
			html += "</tbody></table>";
		}
		$("#rec").html(html);
	}

	function handleJSON(data) {
		if (!data) {
			return ""
		}
		if (typeof data != "string") {
			return data.join(",");
		}
		var data = JSON.parse(data).data;
		if (data.length == 0) {
			return ""
		}
		var items = [];
		for (var i = 0; i < data.length; i++) {
			if (data[i].url) {
				items.push("<a href='" + data[i].url + "' target='_blank'>" + data[i].name + "</a>")
			} else {
				items.push(data[i].name)
			}
		}
		return items.join(",")
	}

	function handleWords(words, canRemove) {
		if (!words) {
			return "";
		}
		var words = words.split("||");
		var items = [];
		for (var i = 0; i < words.length; i++) {
			if (canRemove) {
				items.push("<div><div class='label'>" + words[i] + "<span class='remove-word' data-word='" + words[i] + "'>×</span></div></div>");
			} else {
				items.push("<div><div class='label label-fail'>" + words[i] + "<span class='recover-word' data-word='" + words[i] + "'>×</span></div></div>");
			}

		}
		return items.join("")
	}

	var isLoading = false;

	function getData(data) {
		$.ajax({
			url: segmentUrl,
			data: data,
			type: 'get',
			success: function(res) {
				if (typeof(res) == "string") {
					res = JSON.parse(res);
				}
				if (res.code != 0 || !res.data) {
					console.log("分词结果数据错误");
					return
				}
				var html = renderResult(res.data.wordList, "分词");
				html += renderResult(res.data.labelList, "实体识别");
				$("#result").html(html);
			},
			error: function(e) {
				console.log(e.message);
			}
		});
        data.useLstm = true;
        $.ajax({
            url: segmentUrl,
            data: data,
            type: 'get',
            success: function(res) {
                if (typeof(res) == "string") {
                    res = JSON.parse(res);
                }
                if (res.code != 0 || !res.data) {
                    console.log("分词结果数据错误");
                    return
                }
                var html = renderResult(res.data.labelList, "LSTM实体识别");
                $("#lstm-result").html(html);
            },
            error: function(e) {
                console.log(e.message);
            }
        });
		$.ajax({
			url: recommendUrl,
			data: data,
			type: 'get',
			success: function(res) {
				if (typeof(res) == "string") {
					res = JSON.parse(res);
				}
				if (res.code != 0 || !res.data) {
					console.log("推荐结果数据错误");
					return
				}
				renderRecommendation(res.data);
			},
			error: function(e) {
				console.log(e.message);
			}
		});
	}

	function changeWord(data, valid, callback) {
		var url = valid ? '/wordValidate' : '/wordInvalidate'
		if (!isLoading) {
			isLoading = true;
			$.ajax({
				url: url,
				data: data,
				type: 'post',
				success: function(res) {
					if (res == "ok") {
						$(".alert-success").show(100).delay(1000).hide(100);
						callback && callback();
					} else {
						$(".alert-danger").show(100).delay(1000).hide(100);
					}
					isLoading = false;
				},
				error: function(e) {
					console.log(e);
					isLoading = false;
				}
			})
		}
	}

	function checkSuccess(data, callback) {
		if (!isLoading) {
			isLoading = true;
			$.ajax({
				url: '/batchSuccess',
				data: data,
				type: 'post',
				success: function(res) {
					if (res == "ok") {
						$(".alert-success").show(100).delay(1000).hide(100);
						callback && callback();
					} else {
						$(".alert-danger").show(100).delay(1000).hide(100);
					}
					isLoading = false;
				},
				error: function(e) {
					console.log(e);
					isLoading = false;
				}
			})
		}
	}

	function checkFail(data, callback) {
		if (!isLoading) {
			isLoading = true;
			$.ajax({
				url: '/batchFail',
				data: data,
				type: 'post',
				success: function(res) {
					if (res == "ok") {
						$(".alert-success").show(100).delay(1000).hide(100);
						callback && callback();
					} else {
						$(".alert-danger").show(100).delay(1000).hide(100);
					}
					isLoading = false;
				},
				error: function(e) {
					console.log(e);
					isLoading = false;
				}
			})
		}
	}

	function getPassage(data, callback) {
		if (!isLoading) {
			isLoading = true;
			$(".alert-loading").removeClass("show-off");
			$.ajax({
				url: '/search',
				data: data,
				type: 'post',
				success: function (res) {
					if (res == "error") {
						$(".alert-loading").addClass("show-off");
						$(".alert-danger").show(100).delay(1000).hide(100);
						isLoading = false;
						return
					}
					if (typeof(res) == "string") {
						res = JSON.parse(res);
					}
					$(".alert-loading").addClass("show-off");
					isLoading = false;
					callback && callback(res);
				},
				error: function (e) {
					console.log(e);
					$(".alert-loading").addClass("show-off");
					isLoading = false;
				}
			})
		}
	}
	function saveWord(data) {
		if (!isLoading) {
			isLoading = true;
			$(".alert-loading").removeClass("show-off");
			$.ajax({
				url: '/splitWordSuccess',
				data: data,
				type: 'post',
				success: function (res) {
					if (res == "ok") {
						$(".alert-success").show(100).delay(1000).hide(100);
						$(".passage-status").html("<span class='checked'>已评测</span>");
					} else {
						$(".alert-danger").show(100).delay(1000).hide(100);
					}
					$(".alert-loading").addClass("show-off");
					isLoading = false;
				},
				error: function (e) {
					console.log(e);
					$(".alert-loading").addClass("show-off");
					isLoading = false;
				}
			})
		}
	}


	$("body").on("submit", "form", function(e) {
			e.preventDefault();
			var passage = $("#passage").val();
			var packageName = $("#packageName").val();
			var useDict = $("#useDict").prop('checked') || false;
			if (!passage) {
				bootbox.alert("请输入待分词文段");
				return;
			}
			getData({
				passage: passage,
				packageName: packageName,
				useDict: useDict,
				platform: 1,
				_enc: 0,
				useLstm: false
			});
		})
		.on("click", ".reset", function(e) {
			e.preventDefault();
			$("#passage").val("");
		})
		.on("click", ".remove-word", function(e) {
			var $this = $(this);
			var tableName = $(this).closest("table").prev().text();
			if (tableName) {
				tableName = tableName == "celebrities" ? "celebrity" : tableName;
				tableName = tableName.replace(/s$/, '');
				var mid = $this.closest("tr").data("mid");
				var word = $this.data("word");
				changeWord({
					tableName: tableName,
					word: word,
					type: tableName,
					mid: mid
				}, false, function() {
					$this.closest("tr").find(".delete-word").append("<div><div class='label label-fail'>" + word + "<span class='recover-word' data-word='" + word + "'>×</span></div></div>");
					$this.closest(".label").remove();
				});

			}
		})
		.on("click", ".check-success-one", function() {
			var $this = $(this);
			var mids = $this.closest("tr").data("mid");
			var tableName = $(this).closest("table").prev().text();
			if (tableName) {
				tableName = tableName == "celebrities" ? "celebrity" : tableName;
				tableName = tableName.replace(/s$/, '');
				checkSuccess({
					tableName: tableName,
					mids: mids
				});
			}
		})
		.on("click", ".check-fail-one", function(e) {
			var $this = $(this);
			var mids = $this.closest("tr").data("mid");
			var tableName = $(this).closest("table").prev().text();
			if (tableName) {
				tableName = tableName == "celebrities" ? "celebrity" : tableName;
				tableName = tableName.replace(/s$/, '');
				checkFail({
					tableName: tableName,
					mids: mids
				});
			}
		})
		.on("click", ".nextPassage", function (e) {
			e.preventDefault();
			//var passage = "雷军提到说盗墓笔记，过去150年来，中国内忧外患，正是这150年落后，给中国带来了巨大的“创新红利”。";
			getPassage({
				sql: "select * from passage_label_record_new where status=0  and category = 'sina_news_title' order by rand() limit 1",
				changeStatus: true
			}, function (res) {
				if (res.data && res.data.length && res.data[0].passage) {
					var data = res.data[0];
					var id = data.id;
					historyIds = []
					historyIds.push(id);
					$("#passage").val(data.passage);
					var passage = data.passage;
					var packageName = $("#packageName").val();

					var useDict = $("#useDict").prop('checked') || false;
					if (!passage) {
						bootbox.alert("请输入待分词文段");
						return;
					}
					getData({
						passage: passage,
						useDict: useDict,
						packageName: packageName,
						platform: 1,
						_enc: 0,
                        useLstm: false
					});
				} else {
					$(".alert-danger").show(100).delay(1000).hide(100);
				}
			});

		})
		.on("click", ".nextSave", function (e) {
			e.preventDefault();
			var checkerName = $("#checkerName").val();
			if (!checkerName) {
				bootbox.alert("记得选择评测人！");
				return
			}
			var checkerNameInCookie = Cookie.get("checkerName");
			if (checkerNameInCookie == "" || typeof checkerNameInCookie == "undefined") {
				Cookie.set("checkerName", checkerName, {
					"expires": 5
				});
			}

			var label = "";
			$("input[name='checkbox']:checkbox:checked").each(function () {
				label += $(this).val();
				label+="/1||";
			})
			$("input[name='checkbox']").not("input:checked").each(function () {
				label += $(this).val();
				label+="/0||";
			})
			console.log(label)
			var id = historyIds.pop()
			var changLabelRef = "";

			var timestamp = new Date().getTime();
			var key = md5(timestamp + "3487e49877");
			saveWord({
				tableName: "passage_label_record_new",
				id: id,
				label: label,
				status: 1,
				checkerName: checkerName,
				timestamp: timestamp,
				key: key,
				changLabelRef: changLabelRef
			});

		})

})();