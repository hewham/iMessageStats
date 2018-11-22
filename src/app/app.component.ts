import { Component } from '@angular/core';

import { PapaParseService } from 'ngx-papaparse';
// import { BehaviorSubject } from 'rxjs/Rx';

import * as moment from 'moment';
// import * as onlyEmoji from 'emoji-aware';
declare var require: any;


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  Papa: any;
  onlyEmoji = require('emoji-aware')
  messages = [];
  fileNames = ["Emily"];
  monthObject = {};
  monthArray = [];
  isLoading: boolean = false;
  isBlank: boolean = true;
  wordObject = {};
  wordArray = [];
  showNumberOfWords = 1000;
  showDaily: boolean = false;
  showEmojiCount: boolean = false;
  checkingMessageNumber = 0;
  dailyObject = {};
  dailyArray = [];
  emojiObject = {};
  emojiArray = [];

  selectedDay: any;
  selectedDayMessages = [];


  monthlyChartOptions:any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  monthlyChartLegend: boolean = false;
  monthlyChartType: string = 'bar';
  monthlyChartLabels: any = [];
  monthlyChartData: any = [{
    data:[]
  }];

  dailyChartOptions:any = {
    scaleShowVerticalLines: false,
    responsive: true
  };
  dailyChartLegend: boolean = false;
  dailyChartType: string = 'bar';
  dailyChartLabels: any = [];
  dailyChartData: any = [{
    data:[]
  }];
  chartColors:Array<any> = [
    {
      backgroundColor: 'cornflowerblue'
    }]

  constructor(private papa: PapaParseService) {
    // this.demo();
  }
 

  async main() {
    await this.sortMessages();

    await this.createMonthObject();
    await this.monthObjectToMonthArray();
    await this.sortMonthArray();

    await this.buildBarGraph();
    await this.getStats();
    await this.wordObjectTowordArray();
    await this.sortWordArray();
    if(this.showEmojiCount){
      await this.emojiObjectTowordArray();
      await this.sortEmojiArray();
    }


    console.log("EMOJI ARRAY: ",this.emojiArray);

    setTimeout(function() {
      this.isLoading = false;
      this.isBlank = false;
    }.bind(this), 100);

  }

    // events
    public monthlyChartClicked(e:any):void {
      this.clickedMonth(e.active[0]._model.label);
    }
    public monthlyChartHovered(e:any):void {}
    public dailyChartClicked(e:any):void {
      this.clickedDay(e.active[0]._model.label);
    }
    public dailyChartHovered(e:any):void {}
    
  
    async demo(){
      this.isLoading = true;
      await this.getData();
      this.main();
    }

    clickedEmojiStats(){
      console.log("clickedEmojiStats()");
      this.isLoading = true;
      this.showEmojiCount = true;
      var self = this;
      setTimeout(() => {
        self.main();
      }, 200);
    }

    async clickedOK(){
      this.showEmojiCount = false;
      this.emojiObject = {};
      this.emojiArray = [];
      this.isLoading = true;
      this.showDaily = false;
      this.selectedDayMessages = [];
      this.messages = [];
      var files: any;
      files = document.getElementById("fileInput");
      console.log("files: ",files);
      if(files){
        await this.getFileData(files);
      }
      this.main();
    }

    clickedDay(day){
      this.selectedDay = day;
      this.selectedDayMessages = this.dailyObject[day];
    }

    clickedMonth(month){
      this.showDaily = false;
      this.createDailyObject(month);
      this.createDailyArray(month);
      this.buildDailyGraph();
      setTimeout(function() {
        this.showDaily = true;
      }.bind(this), 100)
    }


    createDailyObject(month){
      this.dailyObject = {};
      for(let message of this.monthObject[month]){
        var monthDay = moment(new Date(message.Date)).format("MMM DD");
        if(monthDay == "Invalid date"){
          var monthDay = moment(parseInt(message.Date)).format("MMM DD");
        }
        if(!this.dailyObject[monthDay]){
          this.dailyObject[monthDay] = [];
        }
        this.dailyObject[monthDay].push(message);
      }
    }
  


    getStats(){
        this.wordObject = {};
        this.checkingMessageNumber = 0;
        for(let i in this.monthArray){
            for(let message of this.monthArray[i].messages){
              this.getWords(message);
              if(this.showEmojiCount){
                this.getEmojis(message.Text);
              }
              this.checkingMessageNumber += 1;
            }
        }
    }

    getWords(message){
      let noPunctuation = message.Text.replace(/[.,\/#!$%\^&\*;?:{}=\-_`~()]/g,"")
      let words = noPunctuation.split(' ')
      for(let word of words){
        word = word.toLowerCase();
        if(word != ""){
          if(!this.wordObject[word]){
            this.wordObject[word] = 1;
          }else{
            this.wordObject[word] += 1;
          }
        }
      }
    }

    getEmojis(messageText){
      if(this.onlyEmoji.onlyEmoji(messageText).length > 0){
        for(let emoji of this.onlyEmoji.onlyEmoji(messageText)){
          if(!this.emojiObject[emoji]){
            this.emojiObject[emoji] = 0;
          }
          this.emojiObject[emoji] += 1;
        }
      }
    }




    //////////////////////   GRAPH   ///////////////////////////

    buildDailyGraph(){
      this.dailyChartLabels.length = 0;
      this.dailyChartLabels = [];
      this.dailyChartData = [{
        data:[]
      }];
      for(let i in this.dailyArray){
        this.dailyChartLabels.push(this.dailyArray[i].day);
        var length = 0;
        if(this.dailyArray[i].messages){
          length = this.dailyArray[i].messages.length;
        }
        this.dailyChartData[0].data.push(length);
      }
    }

    buildBarGraph(){
      this.monthlyChartLabels.length = 0;
      this.monthlyChartLabels = [];
      this.monthlyChartData = [{
        data:[]
      }];
      for(let i in this.monthArray){
        this.monthlyChartLabels.push(this.monthArray[i].month);
        this.monthlyChartData[0].data.push(this.monthArray[i].messages.length);
      }
    }

    //////////////////////   END GRAPH   ///////////////////////////


    //////////////////////   TO ARRAY   ///////////////////////////

    createDailyArray(month){
      this.dailyArray = [];
      var daysInMonth = moment(month, "MMM-YYYY").daysInMonth();
      var onlyMonthName = month.substring(0, 3);
      for(let i=1; i <= daysInMonth; i++){
        var padNum = String(i).padStart(2,"0");
        var monthAndDay = onlyMonthName+" "+padNum;
        var messages = [];
        if(this.dailyObject[monthAndDay]){
          messages = this.dailyObject[monthAndDay];
        }
        this.dailyArray.push({
          day: monthAndDay,
          messages: messages
        })
      }
    }

    emojiObjectTowordArray(){
      this.emojiArray = [];
      for(let i in this.emojiObject){
        this.emojiArray.push({
          emoji: i,
          count: this.emojiObject[i]
        })
      }
    }

    wordObjectTowordArray(){
      this.wordArray = [];
      for(let i in this.wordObject){
        this.wordArray.push({
          word: i,
          count: this.wordObject[i]
        })
      }
    }

    monthObjectToMonthArray(){
      this.monthArray = [];
      for(let i in this.monthObject){
        this.monthArray.push({
          month: i,
          messages: this.monthObject[i]
        })
      }
    }


    //////////////////////  END TO ARRAY   ///////////////////////////


    createMonthObject(){
      this.monthObject = {};
      return new Promise((resolve) => {
        let i: any;
        for(i in this.messages){
            var monthYear = moment(new Date(this.messages[i].Date)).format("MMM-YYYY");
            if(monthYear == "Invalid date"){
              var monthYear = moment(parseInt(this.messages[i].Date)).format("MMM-YYYY");
            }
            if(monthYear != "Invalid date"){
              if(!this.monthObject[monthYear]){
                this.monthObject[monthYear] = [];
              }
            this.monthObject[monthYear].push(this.messages[i]);
            }
        }
        resolve();
      });
    }


    //////////////////////   SORT   ///////////////////////////

    sortMonthArray(){
      return new Promise((resolve) => {
        this.monthArray.sort(function(a,b){
          a = new Date(a.month);
          b = new Date(b.month);
          return a>b ? -1 : a<b ? 1 : 0;
        });
        this.monthArray.reverse();
        resolve();
      });
    }

    sortEmojiArray(){
      return new Promise((resolve) => {
        this.emojiArray.sort(function(a,b){
          a = a.count;
          b = b.count;
          return a>b ? -1 : a<b ? 1 : 0;
        });
        resolve();
      });
    }

    sortWordArray(){
      return new Promise((resolve) => {
        this.wordArray.sort(function(a,b){
          a = a.count;
          b = b.count;
          return a>b ? -1 : a<b ? 1 : 0;
        });
        resolve();
      });
    }

    sortMessages(){
      return new Promise((resolve) => {
        this.messages.sort(function(a,b){
          a = new Date(a.Date);
          b = new Date(b.Date);
          return a>b ? -1 : a<b ? 1 : 0;
        });
        this.messages.reverse();
        resolve();
      });
    }
    //////////////////////  END SORT   ///////////////////////////






    async getData(){
      return new Promise(async (resolve) => {
        for(let fileName of this.fileNames){
          let addMessages: any = await this.parseCSV(fileName);
          this.messages = this.messages.concat(addMessages);
        }
        resolve();
      });
    }

    parseCSV(fileName) {
      return new Promise((resolve) => {
        console.log("in getData...");
        this.papa.parse("assets/CSV_files/"+fileName+".csv", {
          download: true,
          header: true,
          complete: function(results) {
            resolve(results.data);
          }
        });
      });
    }





  ///////////////////////////  POPULATE ////////////////////////////////


    getFileData(files){
      return new Promise(async (resolve) => {
        for(let file of files.files){
          let addMessages = await this.parseCSVFile(file);
          this.messages = this.messages.concat(addMessages);
        }
        resolve();
      });
    }

    parseCSVFile(file) {
      return new Promise((resolve) => {
        this.papa.parse(file, {
          header: true,
          complete: function(results) {
            resolve(results.data);
          }
        });
      });
    }



}
