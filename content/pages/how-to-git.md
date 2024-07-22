---
title: Git ¡Con Perritos!
description: 'Explicación de comandos git usando perritos como ejemplo.'
author: Bryan
toc: false
---

(en construcción)

# Introducción

Utilizar herramientas de versionamiento sirve mucho en la vida computina, pero cuando quise usar git por primera vez estaba un poco confundido de cómo funcionaba todo 😔

Para algunos (y me incluyo), tener una idea visual ayuda mucho más que una explicación, así que como mini-proyecto personal quiero intentar subir de forma ocasional mini ilustraciones describiendo el funcionamiento de los comandos más básicos de Git.

La idea (y el contenido mismo) se encuentran fuertemente inspirados en las ilustraciones de [@girlie_mac](https://girliemac.com/blog/2017/12/26/git-purr/), si no las conocen les invito a revisarlas (están muy cute!).

Otro lugar para aprender git que encuentro muy bacán e interactivo es [LearnGitBranching](https://learngitbranching.js.org/).

## Git Pull
El comando `git pull` actualiza el head actual con los últimos cambios desde el repositorio remoto.
Consideremos el siguiente escenario:

 Local                                  |  Remoto
:---------------------------------------:|:-------------------------:
![image](/img/git/pull_before_local.png) | ![image](/img/git/pull_before_remoto.png)

¡Ahora haremos git pull para actualizar una rama!

 Local Master                            |  Local Blacky
:---------------------------------------:|:-------------------------:
![image](/img/git/pull_after_master.png) | ![image](/img/git/pull_after_blacky.png)

Recuerda que podemos cambiar de rama con `git checkout master / blacky`

Psst! También puedes hacerlo sin cambiar de rama 😉
![image](/img/git/pull_origin.png)
