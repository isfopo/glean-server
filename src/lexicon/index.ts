/**
 * GENERATED CODE - DO NOT MODIFY
 */
import {
  type Auth,
  type Options as XrpcOptions,
  Server as XrpcServer,
  type StreamConfigOrHandler,
  type MethodConfigOrHandler,
  createServer as createXrpcServer,
} from '@atproto/xrpc-server'
import { schemas } from './lexicons.js'

export function createServer(options?: XrpcOptions): Server {
  return new Server(options)
}

export class Server {
  xrpc: XrpcServer
  app: AppNS

  constructor(options?: XrpcOptions) {
    this.xrpc = createXrpcServer(schemas, options)
    this.app = new AppNS(this)
  }
}

export class AppNS {
  _server: Server
  gleam: AppGleamNS

  constructor(server: Server) {
    this._server = server
    this.gleam = new AppGleamNS(server)
  }
}

export class AppGleamNS {
  _server: Server
  actor: AppGleamActorNS

  constructor(server: Server) {
    this._server = server
    this.actor = new AppGleamActorNS(server)
  }
}

export class AppGleamActorNS {
  _server: Server

  constructor(server: Server) {
    this._server = server
  }
}
