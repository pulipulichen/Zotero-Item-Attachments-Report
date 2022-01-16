let retry = 0

let findFirstAndClick = function () {
	let firstOption = $('[aria-label="搜尋結果清單檢視。"] div[role="option"]:first')
	
	if (firstOption.length === 0
		|| firstOption.find('div[data-id]:first').length === 0) {
		setTimeout(() => {
			retry++
			
			if (retry >= 5) {
				return false
			}
			
			findFirstAndClick()
		}, 3000)
	}
	let dataId = firstOption.find('div[data-id]:first').attr('data-id')
	console.log(dataId)
	if (dataId) {
		location.href = `https://drive.google.com/drive/u/0/folders/` + dataId
	}
}


setTimeout(function() {
	console.log('go');
	findFirstAndClick()
}, 5000);