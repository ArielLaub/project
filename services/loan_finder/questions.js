'use strict'

var questions = [
  {
    id: 1,
    description: 'How much funding do you need?',
    order_by: 1,
    options: [
      /*{
        id: 1,
        value: '   0 - 500'        
      },
      {
        id: 2,
        value: '   501- 1000'        
      },*/
      {
        id: 3,
        value: '£1000 - £5000'        
      },
      {
        id: 4,
        value: '£5000 - £10,000'        
      },
      {
        id: 5,
        value: '£10,001 - £25,000'        
      },
      {
        id: 6,
        value: '£25,001 - £50,000'        
      },
      {
        id: 7,
        value: '£50,001 - £150,000'        
      },
      {
        id: 8,
        value: '£150,001 -  £200,000'        
      },
      {
        id: 9,
        value: '£200,001 -£300,000'        
      },
      {
        id: 10,
        value: '£300,000 - £500,000'        
      },
      {
        id: 11,
        value: '£500,001 - 1M£'        
      },
      {
        id: 12,
        value: 'Over  1M£'        
      }
    ]
  },
  {
    id: 2,
    description: 'How long do you need it for?',
    order_by: 2,
    options: [
      {
        id: 13,
        value: ' Ongoing need for capital '        
      },
      {
        id: 14,
        value: 'I am flexible'        
      },
      {
        id: 15,
        value: ' 1 - 5 months'        
      },
      {
        id: 16,
        value: '6 - 12 months'        
      },
      {
        id: 17,
        value: '1 - 2 years'        
      },
      {
        id: 18,
        value: '2 - 3 years'        
      },
      {
        id: 19,
        value: 'Over 3 years'
      }
    ]
  },
  {
    id: 3,
    description: 'Funding purpose',
    explain: '',
    type: '',
    order_by: 3,
    options: [
      {
        id: 20,
        value: 'Start New Business'        
      },
      {
        id: 21,
        value: 'Improve Cash Flow'        
      },
      {
        id: 22,
        value: 'Immediate Needs'        
      },
      {
        id: 23,
        value: 'Working Capital'        
      },
      {
        id: 24,
        value: 'Expansion & Growth'        
      },
      {
        id: 25,
        value: 'Purchase Inventory '        
      },
      {
        id: 26,
        value: 'Real Estate'        
      },
      {
        id: 27,
        value: 'Refinancing Debts'        
      },
      {
        id: 28,
        value: 'Import'        
      },
      {
        id: 29,
        value: 'Export'        
      },
      {
        id: 46,
        value: 'Purchase assets '        
      },
      {
        id: 71,
        value: 'Purchase Business'        
      }
    ]
  },
  {
    id: 4,
    description: 'How long have you been in business?',
    order_by: 4,
    options: [
      {
        id: 30,
        value: 'Not in business yet/ 1-3 months'        
      },
      {
        id: 31,
        value: '4 - 5 months'        
      },
      {
        id: 32,
        value: '6 - 12 months'        
      },
      {
        id: 33,
        value: '1 - 2 years'        
      },
      {
        id: 34,
        value: ' 2 - 3 years'        
      },
      {
        id: 35,
        value: ' Over 3 years'        
      }
    ]
  },
  {
    id: 5,
    description: 'What\'s your business yearly revenue?',
    order_by: 5,
    options: [
      {
        id: 36,
        value: 'No revenue yet'        
      },
      {
        id: 39,
        value: 'under £10,000'        
      },
      /*{
        id: 42,
        value: ' £10,000 - £12,000'        
      },
      */{
        id: 43,
        value: '£10,000 - £12,000'        
      },
      {
        id: 48,
        value: '£12,000 - £30,000'        
      },
      {
        id: 49,
        value: '£30,000 - £36,000'        
      },
      {
        id: 50,
        value: '£36,000-  £50,000'        
      },
      {
        id: 51,
        value: '£50,001 - £100,000'        
      },
      {
        id: 52,
        value: '£100,000 - £1,000,000'        
      },
      {
        id: 53,
        value: '£1,000,000 +'        
      }
    ]
  },
  {
    id: 6,
    description: 'What\'s the legal structure of your business?',
    order_by: 6,
    options: [
      {
        id: 37,
        value: 'Sole Trader'        
      },
      {
        id: 38,
        value: 'Limited Liability Partnership'        
      },
      {
        id: 40,
        value: 'Partnership'        
      },
      {
        id: 41,
        value: 'Limited Company '        
      }
    ]
  },
  {
    id: 7,
    description: 'What industry are you in?',
    order_by: 7,
    options: [
      {
        id: 44,
        value: 'Retail'        
      },
      {
        id: 45,
        value: 'Business Services'    
      },
      {
        id: 47,
        value: 'Leisure & Hopitality '        
      },
      {
        id: 54,
        value: 'Manufacturing '        
      },
      {
        id: 55,
        value: 'Wholesale'        
      },
      {
        id: 56,
        value: 'Real Estate'        
      },
      {
        id: 57,
        value: 'Ecommerce'        
      },
      {
        id: 58,
        value: 'Healthcare'        
      },
      {
        id: 59,
        value: 'Other'        
      }
    ]
  },
  /*{
    id: 11,
    description: 'Do you know your personal credit rating?',
    order_by: 8,
    options: [
      {
        id: 64,
        value: 'I don\'t know'        
      },
      {
        id: 65,
        value: 'Excellent'       
      },
      {
        id: 66,
        value: 'Good'
      },
      {
        id: 67,
        value: 'Fair'
      },
      {
        id: 68,
        value: 'Poor'
      },
      {
        id: 69,
        value: ' Very Poor'
      },
    ]
  },*/
  {
    id: 10,
    description: 'Do you have credit or debit card sales in excess of £2,500 per month?',
    order_by: 9,
    options: [
      {
        id: 62,
        value: 'Yes'
      },
      {
        id: 63,
        value: 'No'
      }
    ]
  },
  {
    id: 9,
    description: 'Do you issue invoices to customers who are businesses or public sector bodies?',
    order_by: 10,
    options: [
      {
        id: 60,
        value: 'Yes'
      },
      {
        id: 61,
        value: 'No'
      }
    ]
  },
  {
    id: 12,
    description: 'Will the business owners provide a personal guarantee?',
    order_by: 11,
    options: [
      {
        id: 72,
        value: 'Yes'
      },
      {
        id: 73,
        value: 'No'
      }
    ]
  }
]

module.exports = questions;