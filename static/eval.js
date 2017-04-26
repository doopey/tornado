(function() {

	var commonSetting = {
		chart: {
			plotBackgroundColor: null,
			plotBorderWidth: null,
			plotShadow: false
		},
		tooltip: {
			pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
		},
		plotOptions: {
			pie: {
				allowPointSelect: true,
				cursor: 'pointer',
				dataLabels: {
					enabled: true,
					format: '<b style="color: #f50;">{point.name}</b>: {point.percentage:.1f} %',
					style: {
						color: (Highcharts.theme && Highcharts.theme.contrastTextColor) || 'black'
					}
				}
			}
		},
		credits: {
			enabled: false
		}
	}

	var commonSubSettings = {
		setting: {
			title: {},
			series: [{
				type: 'pie',
				data: []
			}]
		}
	}

	function output() {
		$.ajax({
			url: '/evalStatInfo',
			data: {},
			type: 'post',
			success: function(res) {
				if (typeof res == 'string') {
					res = JSON.parse(res);
				}
				var config = {};
				for (var cate in res) {
					config[cate] = $.extend(true, {}, commonSubSettings);
					if (cate == "all") {
						config[cate].setting.title.text = "全部分词长度统计";
						config[cate].setting.series[0].name = "全部分词长度统计";
					} else {
						config[cate].setting.title.text = cate + "分词长度统计";
						config[cate].setting.series[0].name = cate + "分词长度统计";
					}
					config[cate].setting.series[0].data = res[cate];
				}
				render(config);
			},
			fail: function(e) {
				console.log(e.message);
			}
		})
	}

	function render(config) {
		for (var i in config) {
			if(config[i].length==0){
				return
			}
			if(i!="all"){
				$(".others").append("<div class='col-sm-6 col-md-4 col-lg-4'><div class='panel panel-default'><div class='panel-heading'><h3 class='panel-title'>"+i+"分词</h3></div><div class='panel-body "+i+"-result'></div></div></div>");
			}
			$('.' + i + '-result').highcharts($.extend(commonSetting, config[i].setting));			
		}
	}

	output();

})();