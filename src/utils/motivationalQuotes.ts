/**
 * Motivational Quotes for Daily Inspiration
 *
 * A collection of short, powerful quotes to motivate users
 * Each quote is translated in English and French
 */

export interface MotivationalQuote {
  text: string;
  author: string;
}

export const motivationalQuotes: Record<'en' | 'fr', MotivationalQuote[]> = {
  en: [
    // Success & Achievement
    { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
    { text: "Success is the sum of small efforts repeated daily.", author: "Robert Collier" },
    { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
    { text: "Excellence is not a destination; it is a continuous journey.", author: "Brian Tracy" },
    { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "What you get by achieving your goals is not as important as what you become.", author: "Zig Ziglar" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },

    // Perseverance & Determination
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
    { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Perseverance is not a long race; it is many short races one after the other.", author: "Walter Elliot" },
    { text: "Our greatest weakness lies in giving up. The most certain way to succeed is always to try just one more time.", author: "Thomas Edison" },
    { text: "The difference between a successful person and others is not a lack of strength, not a lack of knowledge, but rather a lack in will.", author: "Vince Lombardi" },
    { text: "Strength does not come from winning. Your struggles develop your strengths.", author: "Arnold Schwarzenegger" },
    { text: "I never dreamed about success. I worked for it.", author: "Estée Lauder" },
    { text: "The only limit to our realization of tomorrow will be our doubts of today.", author: "Franklin D. Roosevelt" },
    { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },

    // Action & Momentum
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
    { text: "Make each day your masterpiece.", author: "John Wooden" },
    { text: "Opportunities don't happen, you create them.", author: "Chris Grosser" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
    { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
    { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu" },
    { text: "Well done is better than well said.", author: "Benjamin Franklin" },

    // Self-Belief & Confidence
    { text: "Believe in yourself. You are braver than you think, more talented than you know, and capable of more than you imagine.", author: "Roy T. Bennett" },
    { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
    { text: "If you can dream it, you can do it.", author: "Walt Disney" },
    { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
    { text: "Your limitation—it's only your imagination.", author: "Unknown" },
    { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
    { text: "Life is 10% what happens to you and 90% how you react to it.", author: "Charles R. Swindoll" },
    { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
    { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },

    // Growth & Learning
    { text: "The expert in anything was once a beginner.", author: "Helen Hayes" },
    { text: "Mistakes are proof that you are trying.", author: "Unknown" },
    { text: "Fall seven times, stand up eight.", author: "Japanese Proverb" },
    { text: "If you're not willing to risk the usual, you will have to settle for the ordinary.", author: "Jim Rohn" },
    { text: "The only real mistake is the one from which we learn nothing.", author: "Henry Ford" },
    { text: "I find that the harder I work, the more luck I seem to have.", author: "Thomas Jefferson" },
    { text: "Don't wish it were easier. Wish you were better.", author: "Jim Rohn" },
    { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
    { text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Unknown" },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson" },

    // Discipline & Habits
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Aristotle" },
    { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
    { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
    { text: "You'll never change your life until you change something you do daily.", author: "John C. Maxwell" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "It's not what we do once in a while that shapes our lives. It's what we do consistently.", author: "Tony Robbins" },
    { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
    { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
    { text: "Quality is not an act, it is a habit.", author: "Aristotle" },
    { text: "The chains of habit are too weak to be felt until they are too strong to be broken.", author: "Samuel Johnson" },

    // Courage & Resilience
    { text: "Courage is not the absence of fear, but rather the assessment that something else is more important than fear.", author: "Franklin D. Roosevelt" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "The only way out is through.", author: "Robert Frost" },
    { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
    { text: "Rock bottom became the solid foundation on which I rebuilt my life.", author: "J.K. Rowling" },
    { text: "Tough times never last, but tough people do.", author: "Robert H. Schuller" },
    { text: "I am not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
    { text: "Life isn't about waiting for the storm to pass, it's about learning to dance in the rain.", author: "Vivian Greene" },
    { text: "Do not pray for an easy life, pray for the strength to endure a difficult one.", author: "Bruce Lee" },
    { text: "A smooth sea never made a skilled sailor.", author: "Franklin D. Roosevelt" },

    // Focus & Clarity
    { text: "The key is not to prioritize what's on your schedule, but to schedule your priorities.", author: "Stephen Covey" },
    { text: "You can do anything, but not everything.", author: "David Allen" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "The successful warrior is the average man, with laser-like focus.", author: "Bruce Lee" },
    { text: "Concentrate all your thoughts upon the work in hand. The sun's rays do not burn until brought to a focus.", author: "Alexander Graham Bell" },
    { text: "My goal is no longer to get more done, but rather to have less to do.", author: "Francine Jay" },
    { text: "It is not enough to be busy. The question is: what are we busy about?", author: "Henry David Thoreau" },
    { text: "The main thing is to keep the main thing the main thing.", author: "Stephen Covey" },
    { text: "The art of being wise is the art of knowing what to overlook.", author: "William James" },
    { text: "You can't build a reputation on what you are going to do.", author: "Henry Ford" },

    // Dreams & Ambition
    { text: "Dream big and dare to fail.", author: "Norman Vaughan" },
    { text: "The biggest adventure you can take is to live the life of your dreams.", author: "Oprah Winfrey" },
    { text: "Don't downgrade your dream just to fit your reality. Upgrade your conviction to match your destiny.", author: "John Assaraf" },
    { text: "All our dreams can come true, if we have the courage to pursue them.", author: "Walt Disney" },
    { text: "The distance between your dreams and reality is called action.", author: "Unknown" },
    { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
    { text: "A dream doesn't become reality through magic; it takes sweat, determination and hard work.", author: "Colin Powell" },
    { text: "The only thing worse than starting something and failing is not starting something.", author: "Seth Godin" },
    { text: "If you want to live a happy life, tie it to a goal, not to people or things.", author: "Albert Einstein" },
    { text: "Twenty years from now you will be more disappointed by the things you didn't do than by the ones you did do.", author: "Mark Twain" },
  ],
  fr: [
    // Succès & Réalisation
    { text: "Le secret pour avancer est de commencer.", author: "Mark Twain" },
    { text: "Le succès est la somme de petits efforts répétés quotidiennement.", author: "Robert Collier" },
    { text: "Le seul voyage impossible est celui que tu ne commences jamais.", author: "Tony Robbins" },
    { text: "L'excellence n'est pas une destination ; c'est un voyage continu.", author: "Brian Tracy" },
    { text: "Tu n'as pas besoin d'être excellent pour commencer, mais tu dois commencer pour être excellent.", author: "Zig Ziglar" },
    { text: "La seule façon de faire du bon travail est d'aimer ce que tu fais.", author: "Steve Jobs" },
    { text: "Ce que tu obtiens en atteignant tes objectifs est moins important que ce que tu deviens.", author: "Zig Ziglar" },
    { text: "Le succès n'est pas final, l'échec n'est pas fatal : c'est le courage de continuer qui compte.", author: "Winston Churchill" },
    { text: "La meilleure façon de commencer est d'arrêter de parler et de se mettre au travail.", author: "Walt Disney" },
    { text: "N'aie pas peur d'abandonner le bien pour aller vers l'excellence.", author: "John D. Rockefeller" },

    // Persévérance & Détermination
    { text: "Ne regarde pas l'horloge ; fais ce qu'elle fait. Continue d'avancer.", author: "Sam Levenson" },
    { text: "Crois que tu peux et tu es déjà à mi-chemin.", author: "Theodore Roosevelt" },
    { text: "Peu importe la lenteur à laquelle tu avances, tant que tu ne t'arrêtes pas.", author: "Confucius" },
    { text: "La persévérance n'est pas une longue course ; ce sont plusieurs petites courses l'une après l'autre.", author: "Walter Elliot" },
    { text: "Notre plus grande faiblesse est d'abandonner. Le moyen le plus sûr de réussir est toujours d'essayer une fois de plus.", author: "Thomas Edison" },
    { text: "La différence entre une personne qui réussit et les autres n'est pas un manque de force, ni de connaissances, mais plutôt un manque de volonté.", author: "Vince Lombardi" },
    { text: "La force ne vient pas de la victoire. Tes luttes développent ta force.", author: "Arnold Schwarzenegger" },
    { text: "Je n'ai jamais rêvé de succès. J'ai travaillé pour l'obtenir.", author: "Estée Lauder" },
    { text: "La seule limite à notre épanouissement de demain sera nos doutes d'aujourd'hui.", author: "Franklin D. Roosevelt" },
    { text: "Ne laisse pas hier prendre trop de place dans ton aujourd'hui.", author: "Will Rogers" },

    // Action & Momentum
    { text: "L'action est la clé fondamentale de tout succès.", author: "Pablo Picasso" },
    { text: "Le futur dépend de ce que tu fais aujourd'hui.", author: "Mahatma Gandhi" },
    { text: "Fais aujourd'hui quelque chose dont ton futur toi te remerciera.", author: "Sean Patrick Flanery" },
    { text: "Fais de chaque jour ton chef-d'œuvre.", author: "John Wooden" },
    { text: "Les opportunités n'arrivent pas par hasard, tu les crées.", author: "Chris Grosser" },
    { text: "De petites améliorations quotidiennes mènent à des résultats époustouflants.", author: "Robin Sharma" },
    { text: "Ton futur est créé par ce que tu fais aujourd'hui, pas demain.", author: "Robert Kiyosaki" },
    { text: "Le meilleur moment pour planter un arbre était il y a 20 ans. Le deuxième meilleur moment est maintenant.", author: "Proverbe chinois" },
    { text: "Un voyage de mille lieues commence par un seul pas.", author: "Lao Tzu" },
    { text: "Bien fait vaut mieux que bien dit.", author: "Benjamin Franklin" },

    // Confiance en Soi
    { text: "Crois en toi. Tu es plus courageux que tu ne le penses, plus talentueux que tu ne le sais, et capable de plus que tu ne l'imagines.", author: "Roy T. Bennett" },
    { text: "Tu n'es jamais trop vieux pour te fixer un nouvel objectif ou rêver un nouveau rêve.", author: "C.S. Lewis" },
    { text: "Si tu peux le rêver, tu peux le faire.", author: "Walt Disney" },
    { text: "Tout ce que tu as toujours voulu est de l'autre côté de la peur.", author: "George Addair" },
    { text: "Ta seule limitation, c'est ton imagination.", author: "Inconnu" },
    { text: "La seule personne que tu es destiné à devenir est celle que tu décides d'être.", author: "Ralph Waldo Emerson" },
    { text: "Sois toi-même ; tous les autres sont déjà pris.", author: "Oscar Wilde" },
    { text: "La vie est à 10% ce qui t'arrive et à 90% comment tu y réagis.", author: "Charles R. Swindoll" },
    { text: "Tu rates 100% des tirs que tu ne tentes pas.", author: "Wayne Gretzky" },
    { text: "Que tu penses pouvoir ou ne pas pouvoir, dans les deux cas tu as raison.", author: "Henry Ford" },

    // Croissance & Apprentissage
    { text: "L'expert dans n'importe quel domaine était autrefois un débutant.", author: "Helen Hayes" },
    { text: "Les erreurs sont la preuve que tu essaies.", author: "Inconnu" },
    { text: "Tombe sept fois, relève-toi huit fois.", author: "Proverbe japonais" },
    { text: "Si tu n'es pas prêt à risquer l'habituel, tu devras te contenter de l'ordinaire.", author: "Jim Rohn" },
    { text: "La seule vraie erreur est celle dont on n'apprend rien.", author: "Henry Ford" },
    { text: "Je trouve que plus je travaille dur, plus j'ai de chance.", author: "Thomas Jefferson" },
    { text: "Ne souhaite pas que ce soit plus facile. Souhaite être meilleur.", author: "Jim Rohn" },
    { text: "Les défis rendent la vie intéressante et les surmonter lui donne un sens.", author: "Joshua J. Marine" },
    { text: "Tu apprends plus de l'échec que du succès. Ne le laisse pas t'arrêter. L'échec forge le caractère.", author: "Inconnu" },
    { text: "Ce qui est derrière nous et ce qui est devant nous sont peu de choses comparé à ce qui est en nous.", author: "Ralph Waldo Emerson" },

    // Discipline & Habitudes
    { text: "Nous sommes ce que nous faisons à répétition. L'excellence n'est donc pas un acte, mais une habitude.", author: "Aristote" },
    { text: "La discipline est le pont entre les objectifs et l'accomplissement.", author: "Jim Rohn" },
    { text: "La motivation te fait démarrer. L'habitude te fait continuer.", author: "Jim Ryun" },
    { text: "Tu ne changeras jamais ta vie tant que tu ne changes pas quelque chose que tu fais quotidiennement.", author: "John C. Maxwell" },
    { text: "Le guerrier victorieux est l'homme moyen, avec une concentration de laser.", author: "Bruce Lee" },
    { text: "Ce n'est pas ce qu'on fait de temps en temps qui façonne nos vies. C'est ce qu'on fait constamment.", author: "Tony Robbins" },
    { text: "Les bonnes habitudes formées dans la jeunesse font toute la différence.", author: "Aristote" },
    { text: "Oublie d'abord l'inspiration. L'habitude est plus fiable.", author: "Octavia Butler" },
    { text: "La qualité n'est pas un acte, c'est une habitude.", author: "Aristote" },
    { text: "Les chaînes de l'habitude sont trop faibles pour être senties jusqu'à ce qu'elles soient trop fortes pour être brisées.", author: "Samuel Johnson" },

    // Courage & Résilience
    { text: "Le courage n'est pas l'absence de peur, mais plutôt l'évaluation que quelque chose d'autre est plus important que la peur.", author: "Franklin D. Roosevelt" },
    { text: "Cela semble toujours impossible jusqu'à ce que ce soit fait.", author: "Nelson Mandela" },
    { text: "La seule sortie, c'est de traverser.", author: "Robert Frost" },
    { text: "Transforme tes blessures en sagesse.", author: "Oprah Winfrey" },
    { text: "Le fond du gouffre est devenu la fondation solide sur laquelle j'ai reconstruit ma vie.", author: "J.K. Rowling" },
    { text: "Les moments difficiles ne durent jamais, mais les gens courageux oui.", author: "Robert H. Schuller" },
    { text: "Je ne suis pas le produit de mes circonstances. Je suis le produit de mes décisions.", author: "Stephen Covey" },
    { text: "La vie ne consiste pas à attendre que l'orage passe, mais à apprendre à danser sous la pluie.", author: "Vivian Greene" },
    { text: "Ne prie pas pour une vie facile, prie pour avoir la force d'endurer une vie difficile.", author: "Bruce Lee" },
    { text: "Une mer calme n'a jamais fait un bon marin.", author: "Franklin D. Roosevelt" },

    // Focus & Clarté
    { text: "La clé n'est pas de prioriser ton agenda, mais de planifier tes priorités.", author: "Stephen Covey" },
    { text: "Tu peux tout faire, mais pas tout en même temps.", author: "David Allen" },
    { text: "Concentre-toi à être productif plutôt qu'occupé.", author: "Tim Ferriss" },
    { text: "Le guerrier victorieux est l'homme moyen, avec une concentration de laser.", author: "Bruce Lee" },
    { text: "Concentre toutes tes pensées sur le travail en cours. Les rayons du soleil ne brûlent pas tant qu'ils ne sont pas focalisés.", author: "Alexander Graham Bell" },
    { text: "Mon objectif n'est plus d'en faire plus, mais plutôt d'avoir moins à faire.", author: "Francine Jay" },
    { text: "Il ne suffit pas d'être occupé. La question est : à quoi sommes-nous occupés ?", author: "Henry David Thoreau" },
    { text: "L'essentiel est de garder l'essentiel, l'essentiel.", author: "Stephen Covey" },
    { text: "L'art d'être sage est l'art de savoir quoi ignorer.", author: "William James" },
    { text: "Tu ne peux pas construire une réputation sur ce que tu vas faire.", author: "Henry Ford" },

    // Rêves & Ambition
    { text: "Rêve grand et ose échouer.", author: "Norman Vaughan" },
    { text: "La plus grande aventure que tu puisses entreprendre est de vivre la vie de tes rêves.", author: "Oprah Winfrey" },
    { text: "Ne dégrade pas ton rêve pour qu'il corresponde à ta réalité. Améliore ta conviction pour qu'elle corresponde à ton destin.", author: "John Assaraf" },
    { text: "Tous nos rêves peuvent devenir réalité, si nous avons le courage de les poursuivre.", author: "Walt Disney" },
    { text: "La distance entre tes rêves et la réalité s'appelle l'action.", author: "Inconnu" },
    { text: "Va avec confiance dans la direction de tes rêves. Vis la vie que tu as imaginée.", author: "Henry David Thoreau" },
    { text: "Un rêve ne devient pas réalité par magie ; il faut de la sueur, de la détermination et du travail acharné.", author: "Colin Powell" },
    { text: "La seule chose pire que de commencer quelque chose et d'échouer est de ne rien commencer du tout.", author: "Seth Godin" },
    { text: "Si tu veux vivre une vie heureuse, attache-la à un objectif, pas à des personnes ou des choses.", author: "Albert Einstein" },
    { text: "Dans vingt ans, tu seras plus déçu par les choses que tu n'as pas faites que par celles que tu as faites.", author: "Mark Twain" },
  ],
};

/**
 * Get the daily motivational quote based on current date
 * Same quote for the entire day in production mode
 * Random quote each time in test/debug mode
 */
export const getDailyQuote = (language: 'en' | 'fr' = 'en', random: boolean = false): MotivationalQuote => {
  const quotes = motivationalQuotes[language];

  // If random mode (for testing), return a random quote each time
  if (random) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
  }

  // Use today's date as seed for consistent daily quote
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24
  );

  const index = dayOfYear % quotes.length;
  return quotes[index];
};
