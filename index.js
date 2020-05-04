const Alexa = require('ask-sdk-core')
const moment = require('moment')
const request = require('request-promise')

moment.locale('ja', {
    calendar: {
        sameDay : '[今日]',
        nextDay : '[明日]',
        nextWeek : function (now) {
          return (now.week() < this.week()) ? '[来週]dddd' : 'dddd'
        },
        lastDay : '[昨日]',
        lastWeek : function (now) {
          return (this.week() < now.week()) ? '[先週]dddd' : 'dddd'
        },
        sameElse : 'L'
    }
});

const TellMeGomiIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type == 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'TellMeGomi'
  },
  async handle(handlerInput) {
    let slotDate = moment()
    if (handlerInput.requestEnvelope.request.intent) {
      console.log(`slots = ${JSON.stringify(handlerInput.requestEnvelope.request.intent.slots)}`)
      if (handlerInput.requestEnvelope.request.intent.slots.date) {
        slotDate = moment(handlerInput.requestEnvelope.request.intent.slots.date.value)
      }
    }
    console.log(`slotDate = ${slotDate.format('YYYY-MM-DD')}`)

    let items = []
    if (slotDate.day() > 0 && slotDate.day() < 6) {
      let ruleSet = await request({
        url: process.env.RULE_JSON_URL,
        json: true
      })
      id = ruleSet.monthly[slotDate.week() - 1]
      weekRule = ruleSet.rules[id]
      items = weekRule[slotDate.day() - 1]
    }

    let speechText = `${slotDate.calendar()} <say-as interpret-as="date">????${slotDate.format('MMDD')}</say-as> のゴミは`
    if (items.length > 0) {
      speechText += `${items.join(',')} です`
    } else {
      speechText += `ありません`
    }

    const cardTitle = `${slotDate.calendar()} ${slotDate.format('M月D日')} のゴミ`
    let cardContent = ''
    if (items.length > 0) {
      cardContent += items.join('\n')
    } else {
      cardContent += `ありません`
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .withSimpleCard(cardTitle, cardContent)
      .getResponse()
  }
}

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest'
  },
  handle(handlerInput) {
    return TellMeGomiIntentHandler.handle(handlerInput)
  }
}

const ErrorHandler = {
  canHandle() {
    return true
  },
  handle(handlerInput, error) {
    console.log(`err = ${error.message}`);

    return handlerInput.responseBuilder
      .speak('エラーが発生しました')
      .reprompt('エラーが発生しました')
      .getResponse()
  }
}

exports.handler = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    TellMeGomiIntentHandler
  )
  .addErrorHandlers(ErrorHandler)
  .lambda()
