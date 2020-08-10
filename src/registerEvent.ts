import { window, commands, ExtensionContext, ViewColumn } from 'vscode';
import { FundModel } from './views/model';
import { FundService } from './service';
import { FundProvider } from './views/fundProvider';
import { StockProvider } from './views/stockProvider';
import { fundRankHtmlTemp } from './utils';

export function registerViewEvent(
  context: ExtensionContext,
  service: FundService,
  fundPorvider: FundProvider,
  stockPorvider: StockProvider
) {
  const fundModel = new FundModel();

  // Fund operation
  commands.registerCommand('fund.refresh', () => {
    fundPorvider.refresh();
    const handler = window.setStatusBarMessage(`基金数据已刷新`);
    setTimeout(() => {
      handler.dispose();
    }, 1000);
  });
  commands.registerCommand('fund.delete', (target) => {
    fundModel.removeFundCfg(target.id, () => {
      fundPorvider.refresh();
    });
  });
  commands.registerCommand('fund.add', () => {
    window
      .showInputBox({
        prompt: '请输入基金代码，多个用英文逗号隔开（回车保存）',
      })
      .then((code) => {
        if (!code) {
          return;
        }
        fundModel.updateFundCfg(code.replace(/，/g, ','), () => {
          fundPorvider.refresh();
        });
      });
  });
  commands.registerCommand('fund.sort', () => {
    fundPorvider.changeOrder();
    fundPorvider.refresh();
  });

  // Stock operation
  commands.registerCommand('stock.refresh', () => {
    stockPorvider.refresh();
    const handler = window.setStatusBarMessage(`股票数据已刷新`);
    setTimeout(() => {
      handler.dispose();
    }, 1000);
  });
  commands.registerCommand('stock.delete', (target) => {
    fundModel.removeStockCfg(target.id, () => {
      stockPorvider.refresh();
    });
  });
  commands.registerCommand('stock.add', () => {
    window
      .showInputBox({
        prompt: '请输入股票代码，多个用英文逗号隔开（回车保存）',
      })
      .then((code) => {
        if (!code) {
          return;
        }
        fundModel.updateStockCfg(code.replace(/，/g, ','), () => {
          stockPorvider.refresh();
        });
      });
  });
  commands.registerCommand('stock.sort', () => {
    stockPorvider.changeOrder();
    stockPorvider.refresh();
  });

  // Webview
  context.subscriptions.push(
    // 股票点击
    commands.registerCommand(
      'leetfund.stockItemClick',
      (code, name, text, stockCode) => {
        // 创建webview
        const panel = window.createWebviewPanel(
          'stockWebview', // viewType
          name, // 视图标题
          ViewColumn.One, // 显示在编辑器的哪个部位
          {
            // enableScripts: true, // 启用JS，默认禁用
            // retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
          }
        );
        const timestamp = new Date().getTime();
        let sszsImg = code;
        let imageName = stockCode.toLowerCase();
        let timeK = `https://image.sinajs.cn/newchart/min/n/${imageName}.gif`;
        let dailyK = `https://image.sinajs.cn/newchart/daily/n/${imageName}.gif`;
        let weeklyK = `https://image.sinajs.cn/newchart/weekly/n/${imageName}.gif`;
        let monthlyK = `https://image.sinajs.cn/newchart/monthly/n/${imageName}.gif`;
        if (stockCode.indexOf('gb_') === 0) {
          imageName = stockCode.replace('gb_', '.');
          sszsImg = imageName;
          timeK = `https://image.sinajs.cn/newchart/v5/usstock/min/${sszsImg}.gif?${timestamp}`;
          dailyK = `https://image.sinajs.cn/newchart/v5/usstock/daily/${sszsImg}.gif?${timestamp}`;
          weeklyK = `https://image.sinajs.cn/newchart/v5/usstock/weekly/${sszsImg}.gif?${timestamp}`;
          monthlyK = `https://image.sinajs.cn/newchart/v5/usstock/monthly/${sszsImg}.gif?${timestamp}`;
        }

        // https://image.sinajs.cn/newchart/v5/usstock/min/.dji.gif?1596987568173
        panel.webview.html = `<html><body style="background:#eee;color:#333">
          <br/>
          <p style="text-align: center; font-size:18px; width: 400px;margin: 0 auto;">${name}」趋势图、K线图</p>
          <hr />
          <h3>实时走势图</3> <br/>
          <div style="width: 710px;margin:0 auto"><img src="${timeK}" width="700"/></div>
          <br/>
          <h3>日K线图</3> <br/>
          <div style="width: 710px;margin:0 auto"><img src="${dailyK}" width="700"/></div>
          <h3>周K线图</3> <br/>
          <div style="width: 710px;margin:0 auto"><img src="${weeklyK}" width="700"/></div>
          <h3>月K线图</3> <br/>
          <div style="width: 710px;margin:0 auto"><img src="${monthlyK}" width="700"/></div>
        </body></html>`;
      }
    )
  );

  // 基金点击
  context.subscriptions.push(
    commands.registerCommand(
      'leetfund.fundItemClick',
      async (code, name, text) => {
        const res = await service.getFundHistoryByCode(code);
        // 创建webview
        const panel = window.createWebviewPanel(
          'fundWebview',
          name,
          ViewColumn.One
        );
        panel.webview.html = `<html>
          <style>
          .lsjz{
            width: 100%;
            min-width:600px;
            text-align: center;
          }
          .red{
            color:red;
          }
          .grn{
            color:green;
          }
          </style>
          <body>
            <br/>
            <p style="text-align: center; font-size:18px; width: 400px;margin: 0 auto;">「${name}」历史净值</p>
            <hr />
            <br/>
           ${res.content}
          </body></html>`;
      }
    )
  );

  commands.registerCommand('fund.rank', async () => {
    const list = await service.getRankFund();
    const panel = window.createWebviewPanel(
      'fundRankWebview',
      '基金排行榜',
      ViewColumn.One
    );
    const content = fundRankHtmlTemp(list);
    panel.webview.html = `<html>
        <style>
        /*压缩了，需要改格式化再修改*/
        .bg{background-color:#fff;color:#333}.red{color:Red}table{width:100%;min-width:700px;border-collapse:collapse}.name{display:block;width:140px;height:30px;overflow:hidden}.fblue:visited,.fblue a:visited{color:#800080;text-decoration:none}a{outline:0;text-decoration:none}.table{padding:32px 24px}.table thead th{font-size:15px}.table tbody td,.table tbody th{height:30px;line-height:30px;border-bottom:1px dashed #afafaf;text-align:center}tbody .colorize{color:#333}tbody .sort_up,tbody .sort_down{background-color:#eaf1ff}
        </style>
        <body class="bg">
          <br/>
          <p style="text-align: center; font-size:18px; width: 200px;margin: 0 auto;">基金回报排行榜前40</p>
          <p style="text-align: center; font-size:14px; width: 200px;margin: 0 auto;margin-top:4px"><a href="http://vip.stock.finance.sina.com.cn/fund_center/index.html#hbphall" target="_blank">查看更多</a></p>
          <div class="table">
            ${content}
          </div>
        </body></html>`;
  });
  // 基金走势图
  commands.registerCommand('fund.trend', async () => {
    const fundList = service.fundList;
    const panel = window.createWebviewPanel(
      'fundTrendWebview',
      '基金走势',
      ViewColumn.One,
      {
        enableScripts: true, // 启用JS，默认禁用
        retainContextWhenHidden: true, // webview被隐藏时保持状态，避免被重置
      }
    );
    panel.webview.html = `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>基金走势图</title>
        <style>
           body{background:#fff;color:#333}
          .header {
            margin-left: 40px;
            padding: 4px;
            height: 30px;
            line-height: 30px;
            border-bottom: 1px solid #e8e8e8;
            font-size: 18px;
            font-weight: fold;
          }
          .list-items {
            list-style: none;
            padding:0;
          }
          .list-item {
            cursor: pointer;
            height: 30px;
            padding: 4px 8px;
            line-height: 30px;
            border-bottom: 1px solid #e8e8e8;
          }
          .flex {
            display: flex;
          }
          .list {
            display: inline-block;
            max-height:800px;
            min-width:320px;
            overflow-y:auto;
          }
          .content {
            display: inline-block;
            padding-left:10px;
            padding-right:10px;
          }
          img {
            width: 800px;
          }
          .percent {
            font-size: 24px;
            font-weight: fond;
          }
        </style>
      </head>
      <body>
        <div class="flex">
          <div class="list">
            <div class="header">
              基金走势图
            </div>
            <ul class="list-items"></ul>
          </div>
          <div class="content">
            <p>净值：<span class="percent">0.00%</span></p>
            <img
              class="fund-trend"
              src="https://giscafer.gallerycdn.vsassets.io/extensions/giscafer/leek-fund/1.1.5/1597052433264/Microsoft.VisualStudio.Services.Icons.Default"
              alt=""
            />
          </div>
        </div>
        <script>
          var fundList=${JSON.stringify(fundList)};
          var listEl = document.querySelector('.list');
          var listItemUlEl = document.querySelector('.list-items');
          var headerEl = document.querySelector('.header');
          var childs = listEl.childNodes;
          listEl.removeChild(listItemUlEl);
          var listStr = '';
    
          var firstFund = fundList[0].info;
          for (var j = 0; j < fundList.length; j++) {
            var info = fundList[j].info;
            listStr +=
              '<li class="list-item" data-code="' +
              info.code +
              '"  data-percent="' +
              info.percent +
              '">' +
              info.name +
              '（' +
              info.code +
              '）' +
              '</li>';
          }
          headerEl.insertAdjacentHTML(
            'afterend',
            ' <ul class="list-items">' + listStr + '</ul>'
          );
          var trendImgEl = document.querySelector('.fund-trend');
          var percentEl = document.querySelector('.percent');
          handleClick(
            info.code,
            info.percent,
            document.querySelector('.list-items').firstChild
          );
          document.querySelector('.list-items').onclick = function (event) {
            var code = event.target.getAttribute('data-code');
            var percent = event.target.getAttribute('data-percent');
            handleClick(code, percent, event.target);
          };
    
          function handleClick(code, percent, target) {
            document.querySelector('.list-items').childNodes.forEach((c) => {
              c.style.background = '#fff';
              c.style.color = '#333';
            });
            target.style.background = '#1890ff';
            target.style.color = '#fff';
            trendImgEl.src =
              'https://image.sinajs.cn/newchart/v5/fund/nav/ss/' +
              code +
              '.gif?v=' +
              new Date().getTime();
            percentEl.innerHTML = percent + '%';
            if (percent < 0) {
              percentEl.style.color = 'green';
            } else {
              percentEl.style.color = 'red';
            }
          }
        </script>
      </body>
    </html>
    `;
  });
}
