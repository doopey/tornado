(function () {

    var recommendUrl = "http://api.assistant.miui.com/passage/recommend";
    var segmentUrl = "http://api.assistant.miui.com/passage/segmentAndRecognize";
    var segmentGoodsUrl = "http://api.assistant.miui.com/passage/goods/segment";
    if (location.href.indexOf("staging") >= 0) {
        recommendUrl = "http://staging.shenghuo.xiaomi.com/assist/passage/v1/recommend";
        segmentUrl = "http://staging.shenghuo.xiaomi.com/assist/passage/v1/segment";
        segmentGoodsUrl = "http://shenghuo.xiaomi.com/assist/passage/v1/goods/segment";
    }

    var words = [];

    var historyIds = [];

    var changLabelRef = false;
    var shouldSave = false;

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

    function handleWords(wordJson, filter) {
        words = [];
        var filterData = {
            "entertainment": ["CELEBRITY", "PASTIME"],
            "food": ["MERCHANT"],
            "old_entertainmen": ["CELEBRITY", "PASTIME"],
            "tech": ["CELEBRITY"],
            "film_reviews": [],
            "cele_tech": ["CELEBRITY", "PASTIME"],
            "cele_sports": ["CELEBRITY", "PASTIME"],
            "cele_world": ["CELEBRITY", "PASTIME"],
            "cele_history": ["CELEBRITY", "PASTIME"],
            "goods": ["BRAND", "EBRAND", "ENTITY"],
            "evalution": ["CELEBRITY", "PASTIME", "MERCHANT", "BOOK", "BRAND", "EBRAND", "ENTITY"]
        }
        $.each(wordJson, function (index, item) {
            if (typeof item == "string") {
                words.push({
                    "name": item,
                    "props": "O"
                });
            } else if (typeof item == "object") {
                var props = item.tag.toUpperCase() || "O";
                var category = $('input:radio:checked').val();
                if (filter && filterData[category].indexOf(props) < 0) {
                    props = "O";
                }
                words.push({
                    "name": item.word,
                    "props": props
                });
            }
        })
        return words;
    }

    function handleLabel(labels) {
        var reg = /\/o|\/book|\/celebrity|\/merchant|\/pastime|\/brand|\/entity|\/ebrand|\/misc/gi;
        words = [];
        labels = labels.split("||");
        for (var i = 0; i < labels.length; i++) {
            var word = labels[i].replace(reg, "");
            var prop = labels[i].replace(word + "/", "").toUpperCase();
            words.push({
                "name": word,
                "props": prop
            });
        }
        return words;
    }

    function renderSplitWords(words) {
        var html = "<h5 class='sec'>分词结果：</h5>";
        if (words.length == 0) {
            html += "无";
        }
        html += "<div class='word-result'><div class='word-text'>"
        var items = [];
        var itemsProp = [];
        for (var i = 0; i < words.length; i++) {
            items.push(words[i].name);
            itemsProp.push("<label class='col-sm-1 control-label'>" + words[i].name + "</label><div class='col-sm-2'><select class='form-control' name='" + words[i].name + "'>" + renderSelect(words[i].props) + "</select></div>")
        }
        html += items.join(" ") + "</div></div><button class='btn btn-default resplit'>重新分词</button><button class='btn btn-success save'>保存评测结果</button><button type='submit' class='btn btn-primary nextPassage'>下一条</button><form id='result-form' class='form-horizontal' role='form'>";
        html += itemsProp.join("") + "</form>";

        $(".split-result").html(html);
    }

    function renderRecSplitWords(wordList) {
        var recType = ["BOOK", "CELEBRITY", "MERCHANT", "MOVIE", "TVPLAY", "PASTIME", "BRAND", "EBRAND", "ENTITY"];
        var html = "<h5 class='sec'>推荐分词结果：</h5>";
        if (wordList.length == 0) {
            html += "无";
        }
        html += "<div>"
        var items = [];
        for (var i = 0; i < wordList.length; i++) {
            if (recType.indexOf(wordList[i].tag) >= 0) {
                shouldSave = true;
                items.push("<span class='rec-words'>" + wordList[i].word + "（" + wordList[i].tag + "）</span>");
            } else {
                items.push(wordList[i].word);
            }
        }
        html += items.join(" ") + "</div>";
        $(".rec-split-result").html(html);
    }

    function renderSelect(prop) {
        var options = ["O", "BOOK", "CELEBRITY", "PASTIME", "MERCHANT", "MISC", "BRAND", "EBRAND", "ENTITY"];
        var html = "";
        for (var i = 0; i < options.length; i++) {
            if (prop == options[i]) {
                html += "<option value='" + options[i] + "' selected='true'>" + options[i] + "</option>";
            } else {
                html += "<option value='" + options[i] + "'>" + options[i] + "</option>";
            }
        }
        return html;
    }

    var isLoading = false;

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

    function getWord(category) {
        if (category != 'undifined') {
            category = category.toUpperCase();
        } else {
            category = "";
        }
        $.ajax({
            url: segmentUrl,
            data: {
                passage: $("#passage").val(),
                useDict: $("#useDict").prop('checked') || false,
                useEval: true,
                platform: 1,
                textType: category,
                _enc: 0
            },
            type: 'get',
            success: function (res) {
                if (typeof(res) == "string") {
                    res = JSON.parse(res);
                }
                if (res.code != 0 || !res.data) {
                    console.log("分词结果数据错误");
                    return
                }
                renderSplitWords(handleWords(res.data.labelList, true));
                renderRecSplitWords(res.data.labelList);
            },
            error: function (e) {
                console.log(e.message);
            }
        });
    }


    function saveWord(data, type) {
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
                        if (type == 1) {
                            $(".passage-status").html("<span class='unchecked'>待评测</span>");
                        } else {
                            $(".passage-status").html("<span class='checked'>已评测</span>");
                        }
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

    function addPassage(data, callback) {
        if (!isLoading) {
            isLoading = true;
            $(".alert-loading").removeClass("show-off");
            $.ajax({
                url: '/addPassage',
                data: data,
                type: 'post',
                success: function (res) {
                    if (res.result == "ok") {
                        $(".alert-success").show(100).delay(1000).hide(100);
                        callback && callback(res);
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

    var id = $("#itemId").val();
    if (id >= 0) {
        sql = "select * from passage_label_record_new where id=" + id;
        loadPassage(sql, false, false, getWord);
    }
    var checkerName = Cookie.get("checkerName");
    if (checkerName) {
        $("#checkerName").val(checkerName);
    }

    function loadPassage(sql, clearWords, fromHistroy, callback) {
        getPassage({
            sql: sql,
            changeStatus: true
        }, function (res) {
            if (res.data && res.data.length && res.data[0].passage) {
                var data = res.data[0];
                $("#passage").val(data.passage);
                if (data.label) {
                    renderSplitWords(handleLabel(data.label));
                }
                $("#itemId").val(data.id);
                var status = "<span class='unchecked'>未评测</span>";
                if (data.status == 1) {
                    status = "<span class='checked'>已评测</span>";
                } else if (data.status == 2) {
                    status = "<span class='checking'>评测中...</span>";
                }
                $(".passage-status").html(status);
                clearWords && $(".split-result").html("");
                // !fromHistroy && historyIds.push(data.id);
                callback && data.passage && data.category && !data.label && callback(data.category);
            } else {
                $(".alert-danger").show(100).delay(1000).hide(100);
            }
        });
    }

    function resplit() {
        var value = $(".word-result").text();
        $(".word-result").html("<textarea rows='3' class='form-control' id='words'>" + value + "</textarea>");
        $("#words").focus();
        changLabelRef = true;
    }

    var evalution_category = ["toutiao_yule", "toutiao_tiyu"];

    $("body").on("click", ".nextPassage", function (e) {
        e.preventDefault();
        var category = $('input:radio:checked').val();
        if (category == "evalution") {
            var sql = "select * from passage_label_record_new where status=0 and category in ('" + evalution_category.join("', '") +
                "') order by rand() limit 1";
        } else {
            var sql = "select * from passage_label_record_new where status=0 and category='" + category + "' order by rand() limit 1";
        }
        loadPassage(sql, true, false, getWord);
        changLabelRef = false;
        shouldSave = false;
    })
        .on("click", ".lastPassage", function (e) {
            e.preventDefault();
            $(".rec-split-result").html("");
            var currentId = parseInt($("#itemId").val());
            var index = historyIds.indexOf(currentId);
            var lastId;
            if (index > 0) {
                lastId = historyIds[index - 1];
            } else if (historyIds.length) {
                lastId = historyIds[historyIds.length - 1];
            } else {
                bootbox.alert("没有更多的历史记录了！")
                return
            }
            sql = "select * from passage_label_record_new where id=" + lastId;
            loadPassage(sql, false, true, getWord);
        })
        .on("click", ".clearPassage", function (e) {
            e.preventDefault();
            checkerName = $("#checkerName").val();
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
            var id = $("#itemId").val();
            var timestamp = new Date().getTime();
            var key = md5(timestamp + "3487e49877");
            saveWord({
                tableName: "passage_label_record_new",
                id: id,
                label: "",
                status: 0,
                checkerName: checkerName,
                timestamp: timestamp,
                key: key,
                changLabelRef: changLabelRef
            }, 1);

        })
        .on("click", ".addPassage", function (e) {
            e.preventDefault();
            var passage = $("#passage").val();
            if (!passage) {
                bootbox.alert("没有要添加的文段！");
                return
            }
            var timestamp = new Date().getTime();
            var key = md5(timestamp + "3487e49877");
            addPassage({
                passage: passage,
                timestamp: timestamp,
                key: key,
            }, function (res) {
                if (res.data && res.data.insertId) {
                    $("#itemId").val(res.data.insertId);
                    var category = $("#category").val();
                    $(".passage-status").html("<span class='unchecked'>未评测</span>");
                    getWord(category);
                }
            });
        })
        .on("click", ".resplit", function (e) {
            resplit();
        })
        .on("dblclick", ".word-text", function (e) {
            e.preventDefault();
            resplit();
        })
        .on('blur', "#words", function (e) {
            e.preventDefault();
            var value = $("#words").val();
            renderSplitWords(handleWords(value.split(" "), false));
        })
        .on("click", ".save", function (e) {
            e.preventDefault();
            checkerName = $("#checkerName").val();
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
            var result = $("#result-form").serializeArray();
            var label = [];
            $.each(result, function (index, item) {
                var category = $('input:radio:checked').val();
                if ((item.value !== "o" && item.value !== "O") || category == "evalution") {
                    shouldSave = true;
                }
                label.push(item.name + "/" + item.value);
            })
            if (!shouldSave) {
                bootbox.alert("不存在命名实体，不建议保存数据，请评测下一条数据！");
                return
            }
            label = label.join("||");
            var id = $("#itemId").val();
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
            }, 0);
            historyIds.push(parseInt(id));
            changLabelRef = false;
            shouldSave = false;
        })

})()