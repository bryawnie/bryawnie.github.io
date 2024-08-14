---
title: "Usando FP-TS (draft)"
date: 2024-08-14T10:50:40-04:00
draft: true
---

## Option

```ts
type Option<A> = Some<A> | None
```
Podemos pensar en Option como una caja, la cual puede o no contener un elemento de tipo `A`. En general se usa para representar el resultado de un cómputo que podría fallar. Por ejemplo:

```ts
import * as O from 'fp-ts/Option'; // Standard import

const inverse = (x: number): O.Option<number> => 
    x == 0 ? O.none : O.some(1 / x)
```

Evitamos que se levante un error, y en su lugar lo podemos gestionar por nuestra cuenta según lo retornado. Esto también ayuda a que se cumplan las promesas del tipeo.

### Pattern Matching
Supongamos que queremos definir la función `getUIMsgWithInverse` que retorna un mensaje de usuario al intentar obtener el inverso de un número
```ts
const getUIMsgWithInverse = (x: number): string =>
    pipe(
        x,
        inverse, // Option<number>
        O.match(
            () => `Cannot get the inverse of ${x}.`,
            (ix) => `The inverse of ${x} is ${ix}.`,
        ) // string
    )
```

También podemos crear una función `safeInverse`, que en caso de que la división se encuentre indefinida retorne 0:
```ts
import identity from 'fp-ts/function';

const safeInverse = (x: number): number => 
    pipe(
        x,
        inverse, // Option<number>
        O.match(
            () => 0,
            identity,
        ) // number
    )
```
O incluso, podemos hacerlo de una forma mucho más sencilla utilizando `getOrElse(onNone)`:
```ts
const safeInverse = (x: number): number => 
    pipe(
        x,
        inverse, // Option<number>
        O.getOrElse(() => 0), // number
    )
```
> *Notemos que el tipo devuelto por el fallback debe coincidir con el tipo dentro del Option.some. Para devolver tipos distintos según el caso, podemos utilizar `getOrElseW` (similar en `match` y `matchW`).*

### Nullables
Podemos hacer wrapping de nullable values usando Options:

```ts
const value1: number | null = 3
const value2: number | null = null

O.fromNullable(value1) // O.some(3)
O.fromNullable(value2) // O.none
```

### Map, Flatten y Chain
Consideremos la siguiente función que obtiene el primer elemento de un arreglo, que devuelve un *some* A si el arreglo tiene elementos, o un *none* en caso contrario.
```ts
const head = <A>(as: ReadonlyArray<A>): O.Option<A> =>
    as.length === 0 ? O.none : O.some(as[0])

head([5, 6, 7]) // O.some(5)
head([]) // O.none
```

Supongamos ahora que queremos definir una nueva función llamada `getBestMovie`, la cual, dado un arreglo con muchos títulos ordenados por ranking, devuelve un string que indica el título en mayúsculas junto con un label de *Mejor Película*.
```ts
const getBestMovie = 
    (titles: ReadonlyArray<string>): O.Option<string> =>
        pipe(
            titles,
            head, // Option<string>
            O.map((s) => s.toUpperCase()), // Option<string>
            O.map((s) => `Mejor Película - ${s}`), // Option<string>
        )
```

En ocasiones, encadenar funciones en un pipe puede hacer que obtengamos Options anidados, como en el siguiente caso:
```ts
const invHead = (ns: ReadonlyArray<number>) =>
    pipe(
        ns,
        head, // Option<number>
        O.map(inverse), // Option<Option<number>>
        O.flatten,
    )
```
En realidad es bastante común aplicar map y luego un flatten, por lo que se encuentra definido `chain` que hace ambas cosas de una sola vez :)
```ts
    O.chain(inverse)
```

### From Predicate
En general, un predicado indica cuando cierto elemento satisface una condición. Podemos basarnos en estos predicados para crear Options según el valor del mismo:
```ts
const isEven = (a: number) => a%2 === 0

const getEven = O.fromPredicate(isEven)
// (a: number) => Option<number>

getEven(4) // O.some(4)
getEven(5) // O.none
```

### Error Handling
Consideremos que buscamos crear iuna función `getMovieHighlight`, la cual recibe una instancia de película y retorna un string con una característica destadada de esta:
```ts
type Movie = Readonly <{
    title: string
    releaseYear: number
    ratingPosition: number
    award?: string
}>

const movie1: Movie = {
    title: 'Sharknado 10',
    releaseYear: 2023,
    ratingPosition: 1,
    award: 'Oscar'
}

const movie2: Movie = {
    title: 'Night in the Day',
    releaseYear: 2024,
    ratingPosition: 2,
}

const movie3: Movie = {
    title: 'Me sleeping 12 hours',
    releaseYear: 1200,
    ratingPosition: 13728,
}

const getMovieAwardHighlight =
    (movie: Movie): O.Option<string> =>
        pipe(
            movie.award, // string | undefined
            O.fromNullable, // Option<string>
            O.map((award) => `Premiado con: ${award}`),
        ) // Option<string>

const getMovieTop10Highlight =
    (movie: Movie): O.Option<string> =>
        pipe(
            movie,
            O.fromPredicate(({ratingPosition}) =>
                ratingPosition <= 10
            ), // Option<Movie>
            O.map(({ratingPosition}) => 
                `En el TOP 10 en posición: ${ratingPosition}`
            ), // Option<string>
        )

const getMovieHighlight = (movie: Movie): string => 
    pipe(
        movie,
        getMovieAwardHighlight, // Option<string>
        O.alt(() => // Si el anterior es O.none, entra aquí
            getMovieTop10Highlight(movie)
        ), // Option<string>
        O.getOrElse(() => // Fallback option
            `Estrenada en ${movie.releaseYear}`
        ), // string
    )
```
> *Notar que el flujo alternativo debe retornar el mismo tipo que el flujo principal, en este caso, un `Option<string>`. Para omitir esto, podemos usar `altW` (widening).*

## Either
Representa el resultado de un cómputo que podría **fallar**. En términos prácticos, puede ser visto como una solución ante las limitantes del tipo `Option`. Si bien hasta ahora sabemos que `Option` es bastante versátil:
```ts
type Option<A> = Some<A> | None
```
Tenemos el problema de que en caso de error, obtenemos un `None`, lo cual es muy poco descriptivo. En su lugar, resulta útil el tipo `Either`:
```ts
type Either<E, A> = Left<E> | Right<A> 
```
Donde usualmente `E` es el tipo del error, mientras que `A` es el tipo del resultado del cómputo. Veremos más sobre este tipo a continuación:

```ts
import * as E from 'fp-ts/Either'

type Account = Readonly<{
    balance: number
    frozen: boolean
}>

type Cart = Readonly<{
    items: Item[]
    total: number
}>

type AccountFrozen = Readonly<{
    type: 'AccountFrozen'
    message: string
}>

type NotEnoughBalance = Readonly <{
    type: 'NotEnoughBalance'
    message: string
}>

const pay = 
    (ammount: number) =>
        (account: Account): E.Either<
            AccountFrozen | NotEnoughBalance, 
            Account
        > =>
        account.frozen
            ? E.left({
                type: 'AccountFrozen',
                message: '¡No puedes pagar con una cuenta congelada!',
            }) 
            : account.balance < amount 
                ? E.left({
                    type: 'NotEnoughBalance',
                    message: `No puedes pagar ${amount} con un balance de ${account.balance}`,
                }) 
                : E.right({
                    ...account,
                    balance: account.balance - amount
                })

const checkout = 
    (cart: Cart) =>
        (account: Account) =>
            pipe(s
                account,
                pay(cart.total),
                E.match( // Output pattern matching
                    (e) => 'Handle error ...',
                    (a) => 'Hamdle success ...',
                )
            )
```
Una de las mayores ventajas de usar un tipo `Either` en lugar de levantar un error, es que nos ofrece la posibilidad de el tipo del error se encuentra directamente codificado dentro del tipo retornado por la función.

### Error Pattern Matching
Así como hicimos pattern matching sobre el resultado de la función  (error vs output correcto), podemos discernir entre los distintos tipos de error.
```ts
import { makeMatch } from 'ts-adt/MakeADT'

const matchError = makeMatch('type');

E.match( // Output pattern matching
    matchError({
        AccountFrozen: (e) => 'cuenta congelada',
        NotEnoughBalance: (e) => 'faltan fondos',
    }),
    (a) => 'Handle success ...',
)
```

### Try Catch
Utilizar funciones que pueden fallar (arrojar una excepción) presenta complicaciones en un estilo funcional, donde estas pueden estar encadenadas u operar de forma consecutiva. Ahora veremos cómo hacer un wrapper para estos tipos de funciones, de modo que siempre obtengamos un objeto de tipo `Either`.

Usamos como ejemplo la función `JSON.parse`:
```ts
const jsonParse = (text: string): E.Either<Error, unknown> => {
    try {
        const result = JSON.parse(text)
        return E.right(result)
    } catch (e) {
        const error = e instanceof Error ? e : new Error (String(e))
        return E.left(error)
    }
}
```
Si bien esto soluciona el problema, sigue un estilo imperativo y no funcional, por lo que en su lugar utilizaremos `E.tryCatch`, método que nos permite crear una instancia de `Either` a partir de una función que *podría* fallar.
```ts
const tryCatch: <E, A> (
    f: () => A, onThrow: (e: unknown) => E
) => Either<E, A>
```
Apliquémoslo al primer ejemplo:
```ts
const jsonParse = (text: string): E.Either<Error, unknown> => 
    E.tryCatch(
        () => JSON.parse(text),
        E.toError,
    )
```
Esto nos ofrece una solución mucho más limpia. Ahora bien, podemos hacerla aún más limpia utilizando `tryCatchK`:
```ts
const tryCatchK: <A extends unknown[], B, E>(
    f: (...a: A) => B,
    onThrow: (e: unknown) => E
) => (...a: A) => Either<E, B>
```
Entonces, la forma más concisa de ejecutar el `JSON.parse` sería:
```ts
const jsonParse = E.tryCatchk(JSON.parse, E.toError)
```
> *Notar que el error que se obtiene podría llegar a no ser tan descriptivo, y que el tipo retornado por `jsonParse` se indica como  `any` en lugar de `unknown`. Idealmente manejar los errores apropiadamente con tipos específicos según el error. *

### Map, MapLeft & Bimap
En ocasiones podemos querer aplicar transformaciones sobre los tipos de un `Either`.
```ts
import * as J from 'fp-ts/Json'

type Response = Readonly<{
    body: string
    contentLength: number
}>

type JsonStringifyError = Readonly<{
    type: 'JsonStringifyError'
    error: Error
}>

const createResponse = (payload: unknown): E.Either<
    JsonStringifyError, Response> =>
    pipe(
        payload,
        J.stringify, // Either<unknown, string>
        E.map((s) => ({
            body: s,
            contentLength: s.length,
        })), // Either<unknown, Response>
        E.mapLeft((e) => ({
            type: 'JsonStringifyError',
            error: E.toError(e),
        })), // Either<JsonStringifyError, Response>
    )
```
La función `Either.map` se aplica sólo sobre el valor `Right`, y produce como resultado un nuevo `Either`. A su vez, `Either.mapLeft` aplica solo sobre el valor `Left`.

En este caso particular, estamos aplicando un mapeo tanto en el valor de la izquierda como el de la derecha. Luego, podemos simplificar la expresión mediante el uso de `bimap`, la cual nos permite espeficicar dos funciones, una que se aplica sobre el valor de la izquierda, y la segunda sobre el valor de la derecha.
```ts
E.bimap(
    (s) => ({
        body: s,
        contentLength: s.length,
    }),
    (e) => ({
        type: 'JsonStringifyError',
        error: E.toError(e),
    }),
)
```

### FlatMap
En ocasiones podemos tener secuencias de operaciones, cada una de las cuales puede fallar en determinado momento. Consideremos el tipo `User`:
```ts
import base64 from 'base-64'

type User = Readonly<{
    id: number
    username: string
}>

type Base64DecodeError = Readonly<{
    type: 'Base64DecodeError'
    error: Error
}>

const base64Decode = E.tryCatchK(
    base64.decode,
    (e): Base64DecodeError => ({
        type: 'Base64DecodeError',
        error: E.toError(e),
    })
)

declare const decodeUserObjectFromUnknown: (u: unknown) =>
    E.Either<InvalidUserObject, User>

const decodeUser = (encodedUser: string) => 
    pipe(
        encodedUser,
        base64Decode, // Either<Base64DecodeError, string>
        E.map(jsonParse), // Either<Base64DecodeError, Either<JsonParseError, unknown>>
        E.flattenW, // Either<Base64DecodeError | JsonParseError, unknown>
        ...
    )
```
La combinación de `map` con `flattenW` es una práctica común, la cual se puede resumir en `flatMap` (`E.flatMap(jsonParse)`).
```ts
const decodeUser = (encodedUser: string) => 
    pipe(
        encodedUser,
        base64Decode, // Either<Base64DecodeError, string>
        E.flatMap(jsonParse), 
            // Either<Base64DecodeError | JsonParseError, unknown>
        E.flatMap(decodeUserObjectFromUnknown), 
            // Either<Base64DecodeError | JsonParseError | InvalidUserObject, User>
    )
```

### OrElse Error Recovery
Supongamos una página de inicio de sesión, en la cual el usuario puede ya sea ingresar un correo electrónico o un número de teléfono. Nuestro objetivo entonces, es definir una función `validateLoginName` que valide el usuario ingresado.

```ts
const validateEmail = E.fromPredicate(
    (maybeEmail: string) => emailRegex.test(maybeEmail),
    (invalidEmail) => 
        invalidEmail.includes('@') ?
            'MalformedEmail' : 'NotAnEmail'
)

const validateLoginName = (loginName: string) =>
    pipe(
        loginName,
        validateEmail, // E.Either<'MalformedMail' | 'NotAnEmail', string>
    )
```

Si asumimos que la validación de correo electrónico falló, nos gustaría intentar ver si es un número de teléfono válido en su lugar. Para ello, necesitamos primero crear una función que nos valide números de teléfono:

```ts
const validatePhoneNumber = E.fromPredicate(
    (maybePhoneNumber: string) => 
        phoneNumberRegex.test(maybePhoneNumber),
    () => 'InvalidPhoneNumber' as const,  
)

const validateLoginName = (loginName: string) =>
    pipe(
        loginName,
        validateEmail, // E.Either<'MalformedMail' | 'NotAnEmail', string>
        E.orElse((e) =>
            e === 'NotAnEmail' ?
                validatePhoneNumber(loginName) :
                E.left(e)
        ), // Either<'MalformedEmail' | 'InvalidPhoneNumber', string>
    )
```
Cuando utilizamos `Either.orElse`, proveemos una función que, en caso de que la opción anterior haya producido un error (tener Left definido), provee una nueva instancia de `Either`.

Hasta este punto, aplicamos una revisión del formato del nombre de usuario, verificando si es un correo electrónico válido o un número de teléfono. Si bien manejamos correctamente los errores, al obtener el resultado no sabemos qué tipo de login es. Usemos tipos!
```ts
type Email = Readonly<{
    type: 'Email'
    value: string
}>

const validateEmail = flow(
    E.fromPredicate(
        (maybeEmail: string) => emailRegex.test(maybeEmail),
        (invalidEmail) => 
            invalidEmail.includes('@') ?
                'MalformedEmail' : 'NotAnEmail'
    ),
    E.map((email): Email => 
        ({ type: 'Email', value: email })),
)
```
Por el lado del teléfono:
```ts
type PhoneNumber = Readonlu<{
    type: 'PhoneNumber'
    value: string
}>

const validatePhoneNumber = flow(
    E.fromPredicate(
        (maybePhoneNumber: string) => 
            phoneNumberRegex.test(maybePhoneNumber),
        () => 'InvalidPhoneNumber' as const,  
    ),
    E.map((phoneNumber): PhoneNumber =>
        ({ type: 'PhoneNumber', value: phoneNumber }))
)
```
Esto nos genera problemas con el `orElse`, puesto que el tipo de la derecha puede ser tanto un `PhoneNumber` como `Email`, mientras que la validación previa sólo considera un `Email`. Para solucionarlo utilizamos `orElseW`:

```ts
const validateLoginName = (loginName: string) =>
    pipe(
        loginName,
        validateEmail, // E.Either<'MalformedMail' | 'NotAnEmail', Email>
        E.orElseW((e) =>
            e === 'NotAnEmail' ?
                validatePhoneNumber(loginName) :
                E.left(e)
        ), // Either<'MalformedEmail' | 'InvalidPhoneNumber', Email | PhoneNumber>
    )
```

#### Definiendo Errores
Si definimos los errores anteriores como tipos, en el caso del `email`:
```ts
type MalformedEmail = Readonly<{
    type: 'MalformedEmail'
    error: Error
}>

type NotAnEmail = Readonly<{
    type: 'NotAnEmail'
    error: Error
}>

const validateEmail = flow(
    E.fromPredicate(
        (maybeEmail: string) => emailRegex.test(maybeEmail),
        (invalidEmail): MalformedEmail | NotAnEmail => 
            invalidEmail.includes('@')
                ? {
                    type: 'MalformedEmail',
                    error: new Error('Malformed email!'),
                }
                : {
                    type: 'NorAnEmail',
                    error: new Error('Not an email'),
                }
    ),
    E.map((email): Email => 
        ({ type: 'Email', value: email })),
)
```
Mientras que en el caso del número de teléfono:
```ts
type InvalidPhoneNumber = Readonly<{
    type: 'InvalidPhoneNumber'
    error: Error
}>

const validatePhoneNumber = flow(
    E.fromPredicate(
        (maybePhoneNumber: string) => 
            phoneNumberRegex.test(maybePhoneNumber),
        (): InvalidPhoneNumber => ({
            type: 'InvalidPhoneNumber'
            error: new Error('Invalid phone number!')
        }) 
    ),
    E.map((phoneNumber): PhoneNumber =>
        ({ type: 'PhoneNumber', value: phoneNumber }))
)
```
Esto nos acarrea un problema a la función `validateLoginName`, ya que Typescript no es capaz de inferir apropiadamente los tipos. Para ello se los indicamos explícitamente.
```ts
const validateLoginName = (loginName: string) =>
    pipe(
        loginName,
        validateEmail, // E.Either<'MalformedMail' | 'NotAnEmail', Email>
        E.orElseW((e): E.Either<InvalidPhoneNumber | MalformedEmail, PhoneNumber> =>
            e === 'NotAnEmail' ?
                validatePhoneNumber(loginName) :
                E.left(e)
        ), // Either<'MalformedEmail' | 'InvalidPhoneNumber', Email | PhoneNumber>
    )
```

## Side-Effects y Funciones no Deterministas en FP-TS
Se define `IO<A>` como un cómputo síncrono no-determinista que puede causar *side-effects*. A su vez, retorna un valor de tipo `A` y jamás falla.

Esta abstracción permite mantener funciones *puras* a la vez que poseemos *side-effects*. En términos simples, un `IO` representa un *side-effect* sin ejecutarlo, en lugar de ello, genera una descripción de lo que *debería hacer* el *side-effect*.

```ts
type IO<A> = () => A

// Ejemplos
const random: IO<number> = () => Math.random()
const now: IO<number> = () => Date.now()
const greet: IO<void> = () => console.log('Hello, world!')

const print = (s: string): IO<void> =>
    () => console.log(s)
```
Esto mantiene a `print` como una función "pura", ya que siempre retorna "lo mismo" dado el mismo input. Se recomienda separar siempre el *side-effect* de la función.