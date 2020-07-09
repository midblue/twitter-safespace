require('dotenv').config()
const Twitter = require('twitter')
const rateLimiter = require('./rateLimiter')

const updateLimiter = rateLimiter(
  300 / 300,
  Math.ceil((3.05 * 60 * 60 * 1000) / 300),
)

const searchLimiter = rateLimiter(
  180 / 180,
  Math.ceil((15.5 * 60 * 1000) / 180),
)

var client = new Twitter({
  consumer_key: process.env.CK,
  consumer_secret: process.env.CSK,
  access_token_key: process.env.AT,
  access_token_secret: process.env.AST,
})

test()

async function test() {
  let currentMaxId,
    areMoreTweets = true
  const allTweets = []
  while (areMoreTweets) {
    const { tweets, next_max_id } = await getNext100TweetsForSearchTermPastId(
      '@watch_ssbm',
      currentMaxId,
    )
    allTweets.push(...tweets)
    console.log('got', tweets.length, 'tweets,', allTweets.length, 'total')
    currentMaxId = next_max_id
    areMoreTweets = tweets.length
  }
  console.log('done!', allTweets.length, 'total tweets')
}

function getNext100TweetsForSearchTermPastId(q, max_id) {
  return new Promise(resolve => {
    searchLimiter.queue(() =>
      client.get(
        `search/tweets`,
        {
          q,
          result_type: 'recent',
          count: 100, // 100 is api limit
          tweet_mode: 'extended',
          exclude: 'retweets',
          max_id,
        },
        (error, response) => {
          if (error) throw error
          const tweets = response.statuses.map(tweet => ({
            id_str: tweet.id_str,
            created_at: tweet.created_at,
            text: tweet.full_text,
            user: {
              id_str: tweet.user.id_str,
              screen_name: tweet.user.screen_name,
              followers_count: tweet.user.followers_count,
              created_at: tweet.user.created_at,
            },
          }))
          const metadata = response.search_metadata
          const next_max_id_regex = /max_id=(\d*)&q=/gi
          const next_max_id_regex_result =
            next_max_id_regex.exec(metadata.next_results) || []
          const next_max_id = next_max_id_regex_result[1]
          resolve({ tweets, next_max_id })
        },
      ),
    )
  })
}

// client.get('statuses/user_timeline', { screen_name: 'midblue' }, function (
//   error,
//   tweets,
//   response,
// ) {
//   if (!error) {
//     console.log(
//       tweets
//         .map(tweet =>
//           tweet.text
//             .replace(/https?([^ ]*)/gi, '')
//             .replace(/R?T? ?@([^ ]*)/gi, '')
//             .replace(/^\s*/gi, '')
//             .replace(/\s*$/gi, ''),
//         )
//         .filter(t => t),
//     )
//   }
// })

// updateLimiter.queue(() => {
//   client.post('statuses/update', { status: 'Testing yall!' }, function (
//     error,
//     tweet,
//     response,
//   ) {
//     if (error) throw error
//     console.log(tweet) // Tweet body.
//   })
// })

// client.get(`statuses/show/1267459874788646912`, (error, tweet, res) => {
//   if (error) throw error
//   console.log(tweet, !!res)
// })
