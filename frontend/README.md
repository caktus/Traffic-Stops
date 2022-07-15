# NC CopWatch

## Component types

Components are separated in to three types:

1. Components. These are responsible for rendering and rendering logic.
2. Containers. These are distinguished from Components in that they are responsible for rendering other components based on some condition.
3. Elements. These are display only. Heading elements, Skeletons, Logos-- things that appear all over the app.

## Routing

We're using [React Router](https://reactrouter.com/web/guides/quick-start) for single-page routing. Note the use of [constants](src/Routes/slugs.js) to help keep route names DRY. React Router routing involves somewhat of a paradigm shift in the way one thinks about browser routing. The simplest way to look at is as follows: if the `to` prop of a React Router <Route /> matches the URL, the component renders. This is different from something like, "change the root component to this component if the route matches". More than one component can render based on the URL. This allows for some pretty powerful, if somewhat complex patterns.

## Async bundles

This project makes use of [code-splitting](https://reactjs.org/docs/code-splitting.html) in tandem with routing, to allow dynamic loading of bundles based on the URL visited. See [FJRoute.js](src/Components/Containers/FJRoute.js) for implementation, and [Charts.js](src/Components/Charts/Charts.js) for example usage.

## Loading/Skeletons

Prefer the use of [skeleton loaders](https://design.gitlab.com/components/skeleton-loader/) over spinners where applicable. There is a [chart skeleton](src/Components/Elements/PieSkeleton.js) currently in use, for starters. There are various tools for create svg skeletons.

## Animation

Animation is implemented using [Framer-Motion](https://www.framer.com/api/motion/). There's a learning curve, but once it clicks it's a very powerful animation tool.  
Philosophically, this project utilizes animation to ease transitions for the user. An animation here should, if used in the right place, solved one or more of the following problems:

1. The user has clicked a button, but isn't sure if anything happened. Animating a color change, shadow change, or showing an animated loading indicator/skeleton can indicate that their input has been recieved and understood.
2. The user navigated to a different section/page, but because of shared content (like header or sidebar) it's hard to tell if anything changed-- did my click work? Sliding content in or out (subtly, please...)-- some sort of transition-- can help smooth the change of view.
3. The user is unsure of the purpose of an interactive UI element. Here, an animation (in this case, often called a micro-interaction), can provide feedback on a small scale to help the user understand the function of an interaction. Think a slidable toggle, or a color wheel, or something like that.

## Styles 💅🏻

[Styles documentation](src/styles/styles.md)

## Testing 🛠

[Testing documenation](cypress/testing.md)

## Absolute Imports

Javascript tooling typically requires relative imports. We've configured this project a little differently using [create-react-app bootstrapping and the `jsconfig.json` file](https://create-react-app.dev/docs/importing-a-component/#absolute-imports). This was done to make dynamic bundle imports a little more modular. Imports can be either relative or absolute based on the baseUrl set in `jsconfig.json`. This is currently set to the `src` directory. For consistency's sake, let's use absolute imports.
