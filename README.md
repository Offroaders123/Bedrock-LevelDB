# Bedrock-LevelDB

An experimental project to work with Minecraft Bedrock world saves!

Running:

```sh
git clone https://github.com/Offroaders123/Bedrock-LevelDB.git --recurse-submodules
cd ./Bedrock-LevelDB/
npm install
npm run build
```

Currently this isn't set up to be used as a nice standalone package, eventually I plan to have that though. Right now it's still in the exploration stages, so things are neither the most performant (as they could be), nor completely functional/modular yet.

The goal with this is to eventually make a nice bridge between the LevelDB format (Bedrock uses) itself, and the types that I have over in Region-Types. So I want to have a functional API that works on top of the database itself, and all of the content that it may possibly contain, but without having to interact with the database itself. Things are not yet to that point though, and it is still in figuring out the format of the contents stored in the database itself, rather than to the point of abstracting the database part away.

Once I am to the point of providing an API that works above the database itself, then I can figure out how to bridge those APIs across similar ones for the other Minecraft versions as well. Say like there is a set of APIs for Java's Region format, which abstract out the Region part of that. Then I can use the similarities over those APIs to hypothetically have a single overarching API that works for all worlds, because it is driven by building blocks that work for each version on it's own.

So I don't want to shoehorn all world formats and versions into a single API that works everywhere, but rather to write bindings for each Minecraft version/platform, which can then be built on top of safely (because the types for each version have been written out), then there can be a single API that works across all of those. The notable part here is also that you should be able to work with each of the formats/versions natively on it's own, without needing to use the single overarching API that works across all of them.

I think the note of making sure to remove coupling between things is the important part I am learning to mitigate with my projects. If something is modular, then it can work on it's own. A bigger module that abstracts things away may need modules below it, but the lower down you go, each of those should work on it's own, without any other modules.

I want to prevent things like if you were to cross two wires to plug the other one in. Not sure how to visualize that completely, but yeah. One wire shouldn't depend on the other one being plugged in, for the other to work. I think that's the general concept. Maybe they can both be powered by a single wire, but you shouldn't implicitly solder them together so they work, you should properly attach a connector so they can be separated properly.

Back in Minecraft terms, you shouldn't have to know how Legacy Console Edition works in order to edit a Bedrock world.